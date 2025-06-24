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
import * as filters from '@libp2p/websockets/filters'
import type { Libp2p } from 'libp2p'
import type { Helia } from 'helia'
import { multiaddr } from '@multiformats/multiaddr'
import delay from 'delay'
import pRetry from 'p-retry'
import { WebRTC as WebRTCMatcher } from '@multiformats/multiaddr-matcher'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'


const TOPICS = {
  PEER_ANNOUNCE: 'ah-p2p.market/peer-announce',
  PEER_REQUEST: 'ah-p2p.market/peer-request', 
  PEER_LIST: 'ah-p2p.market/peer-list'
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

    const startHelia = async () => {
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
                        '/webrtc'
                    ]
                },
                transports: [
                    webSockets(),
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

            /*The creation and deployment of a circuit relay is not covered in this documentation. However, you can use the one bundled with the OrbitDB unit tests by cloning the OrbitDB repository, installing the dependencies and then running `npm run webrtc` from the OrbitDB project's root dir. Once running, the webrtc relay server will print a number of addresses it is listening on. Use the address /ip4/127.0.0.1/tcp/12345/ws/p2p when specifying the relay for browser 1.
            */
            const relay = `/dns4/ah-p2p.market/tcp/443/wss/p2p/16Uiu2HAm3TCXKkf8uBHsf1kL4TXC8325P7mxJUzPy8iskhewiyAV`

            const dial = await helia.libp2p.dial(multiaddr(relay))
            console.log('Dialed to relay', dial)

            /*
            const a1 = await pRetry(async () => {
                const addr = helia.libp2p.getMultiaddrs().filter(ma => WebRTCMatcher.matches(ma)).pop()

                if (addr == null) {
                    await delay(10)
                    throw new Error('No WebRTC address found')
                }

                return addr
            })
                */

            helia.libp2p.services.pubsub.addEventListener('message', (evt) => {
                const {topic, data} = evt.detail
                console.log('Received message:', topic, data)
                switch (topic) {
                    case TOPICS.PEER_LIST:
                        const peers = JSON.parse(new TextDecoder().decode(data))
                        console.log('Received peers:', peers)
                        break
                    default:
                        console.log('unknown topic', topic)
                }
            })

            helia.libp2p.services.pubsub.subscribe(TOPICS.PEER_LIST)
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