import { type ReactNode, createContext, useEffect, useState } from 'react'
import { IDBBlockstore } from 'blockstore-idb'
import { IDBDatastore } from 'datastore-idb'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { noise } from "@chainsafe/libp2p-noise"
import { yamux } from "@chainsafe/libp2p-yamux"
import { webRTC } from "@libp2p/webrtc"
import { webSockets } from "@libp2p/websockets"
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2"
import { identify } from "@libp2p/identify"
import { webTransport } from '@libp2p/webtransport'
import { echo } from '@libp2p/echo'
import { WebRTC } from '@multiformats/multiaddr-matcher'

import * as filters from '@libp2p/websockets/filters'
import type { Libp2p } from 'libp2p'
import type { Helia } from 'helia'
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr'
import delay from 'delay'
import pRetry from 'p-retry'
import { WebRTC as WebRTCMatcher } from '@multiformats/multiaddr-matcher'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'


const TOPICS = {
  PEER_ANNOUNCE: 'ah-p2p.market/peer-announce',
  PEER_REQUEST: 'ah-p2p.market/peer-request', 
  PEER_LIST: 'ah-p2p.market/peer-list',
  PING: 'ah-p2p.market/ping',
  PONG: 'ah-p2p.market/pong'
}

export const HeliaContext = createContext({
    libp2p: null as Libp2p | null,
    helia: null as Helia | null,
    error: false,
    starting: true,
    startHelia: async () => { },

})

export const HeliaProvider = ({ children }: { children: ReactNode }) => {
    const [isInitialized, setIsInitialized] = useState(false)
    const [libp2p, setLibp2p] = useState<Libp2p | null>(null)
    const [helia, setHelia] = useState<Helia | null>(null)
    const [error, setError] = useState(false)
    const [starting, setStarting] = useState(true)

    const startHelia = async (): Promise<void> => {
        const datastoreName = 'ah-p2p-datastore'
        const blockstoreName = 'ah-p2p-blockstore'

        const datastore = new IDBDatastore(datastoreName)
        const blockstore = new IDBBlockstore(blockstoreName)

        try {
            await datastore.open()
            await blockstore.open()

            const options = {
                datastore,
                addresses: {
                    listen: [
                        '/p2p-circuit',
                        '/webrtc'
                    ]
                },
                transports: [
                    webSockets({
                    }),
                    webRTC(),
                    circuitRelayTransport()
                ],
                connectionEncrypters: [noise()],
                streamMuxers: [yamux()],
                connectionGater: {
                    denyDialMultiaddr: () => {
                        return false
                    }
                },
                services: {
                    identify: identify(),
                    echo: echo(),
                    pubsub: gossipsub({
                        allowPublishToZeroTopicPeers: true,
                    })
                }
            }

            const libp2p = await createLibp2p(options)
            const helia = await createHelia({ libp2p, datastore, blockstore })

            helia.libp2p.addEventListener('connection:open', (evt) => {
                console.log('New connection to:', evt.detail.remoteAddr.toString())
            })

            helia.libp2p.addEventListener('connection:close', (evt) => {
                console.log('Connection closed to:', evt.detail.remoteAddr.toString())
            })

            const relay = `/dns4/ah-p2p.market/tcp/443/wss/p2p/16Uiu2HAm3TCXKkf8uBHsf1kL4TXC8325P7mxJUzPy8iskhewiyAV`
            await helia.libp2p.dial(multiaddr(relay))
            console.log('Dialed to relay, checking connection stability...')

            // Create a promise that resolves when we get a pong
            const waitForStableConnection = new Promise<void>((resolve) => {
                let pingInterval: NodeJS.Timeout | null = null
                helia.libp2p.services.pubsub.subscribe(TOPICS.PONG)
                const pongListener = (evt: { detail: { topic: string, data: Uint8Array } }) => {
                    const {topic, data} = evt.detail
                    if (topic === TOPICS.PONG) {
                        console.log('Received pong - connection is stable')
                        // Clear the ping interval
                        if (pingInterval) {
                            clearInterval(pingInterval)
                            pingInterval = null
                        }
                        // Remove this pong listener
                        helia.libp2p.services.pubsub.removeEventListener('message', pongListener)
                        resolve()
                    }
                }
                // Subscribe to pong messages
                helia.libp2p.services.pubsub.addEventListener('message', pongListener)
                
                // Start sending pings
                pingInterval = setInterval(() => {
                    console.log('Sending ping')
                    helia.libp2p.services.pubsub.publish(TOPICS.PING, new Uint8Array())
                }, 1000)
            })
            // Wait for stable connection before proceeding
            await waitForStableConnection

            // Wait for addresses to be generated (circuit relay + WebRTC)
            const waitForWebRTCAddress = new Promise<Multiaddr>((resolve) => {
                const interval = setInterval(() => {
                    const multiAddrs = helia.libp2p.getMultiaddrs()
                    const webRTCMultiaddr = helia.libp2p.getMultiaddrs().find(ma => WebRTC.matches(ma))
                    console.log('WebRTC Multiaddr', webRTCMultiaddr?.toString())
                    if (webRTCMultiaddr) {
                        clearInterval(interval)
                        resolve(webRTCMultiaddr)
                    }
                }, 1000)
            })
            const webRTCMultiaddr = await waitForWebRTCAddress
            console.log('WebRTC Multiaddr', webRTCMultiaddr.toString())

            const announceAddressListener = (evt: { detail: { topic: string, data: Uint8Array } }) => {
                const {topic, data} = evt.detail
                if (topic === TOPICS.PEER_ANNOUNCE) {
                    const address = JSON.parse(new TextDecoder().decode(data))
                    console.log('Announced address', address)
                }
            }


            
            const peerListListener = (evt: { detail: { topic: string, data: Uint8Array } }) => {
                const {topic, data} = evt.detail
                if (topic === TOPICS.PEER_LIST) {
                    const peerList = JSON.parse(new TextDecoder().decode(data))
                    console.log('Peer list', peerList)
                    peerList.forEach((peer: { peerId: string, multiaddrs: string }) => {
                        console.log('personal peerid', helia.libp2p.peerId.toString())
                        console.log('peer id', peer.peerId)
                        if (peer.peerId !== helia.libp2p.peerId.toString()) {
                            console.log('dialing peer', peer.multiaddrs)
                            helia.libp2p.dial(multiaddr(peer.multiaddrs))
                        }
                    })
                    // TODO: Add peers to the peer list
                    // TODO: Add peers to the peer list
                }
            }
            helia.libp2p.services.pubsub.addEventListener('message', peerListListener)
            console.log('Connection is stable, subscribing to peer list')

            // Now that we have a stable connection, subscribe to peer list and request peers
            helia.libp2p.services.pubsub.subscribe(TOPICS.PEER_LIST)

            console.log('Subscribed to peer list')
            console.log('Publishing peer request')
            helia.libp2p.services.pubsub.publish(TOPICS.PEER_REQUEST, new Uint8Array())

             
            // Log discovered peers periodically
            setInterval(() => {
                console.log('Logging peers')
                const peers = helia.libp2p.getPeers()
                console.log(`Connected to ${peers.length} peers:`, peers.map(p => p.toString()))
            }, 5000)
             
            setLibp2p(libp2p)
            setHelia(helia)
            setStarting(false)
            setIsInitialized(true)

        } catch (error) {
            setError(true)
            console.error(error)
        }
    }

    useEffect(() => {
        if (!isInitialized) {
            startHelia()
        }
    }, [isInitialized])

    return (
        <HeliaContext.Provider value={{
            libp2p,
            helia,
            error,
            starting,
            startHelia,
        }}>
            {children}
        </HeliaContext.Provider>
    )
}