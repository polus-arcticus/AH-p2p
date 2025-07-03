import { type ReactNode, createContext, useEffect, useState, useCallback } from 'react'
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
import { useAccount, useWalletClient } from 'wagmi'

import { WebRTC } from '@multiformats/multiaddr-matcher'
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

import { createOrbitDB, useIdentityProvider } from '@orbitdb/core'
import * as OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'
import type { OrbitDB } from '@orbitdb/core-types'
import { getWalletInterface } from '../utils/blockchain'
import { PubsubService } from '../services/pubsub'

import type { AHP2PHelia } from '../types'
export const HeliaContext = createContext({
    starting: true,
    error: false,
    AHP2P: null as any
})

export const HeliaProvider = ({ children }: { children: ReactNode }) => {
    const [starting, setStarting] = useState(true)
    const [error, setError] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [AHP2P, setAHP2P] = useState<any>(null)
    
    useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
    const walletClient = useWalletClient()
    const { address } = useAccount()

    const startHelia = useCallback(async (): Promise<void> => {
        if (!address || !walletClient.data) return

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
                    webSockets({}),
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
            const helia = await createHelia({ libp2p, datastore, blockstore }) as AHP2PHelia

            const identityProvider = OrbitDBIdentityProviderEthereum.default({
                wallet: getWalletInterface({
                    address,
                    walletClient: walletClient.data
                })
            })

            helia.libp2p.addEventListener('connection:open', (evt) => {
                const addr = evt.detail.remoteAddr.toString()
                console.log('New connection to:', addr)
                if (addr.includes('/webrtc/')) {
                    console.log('✅ Direct WebRTC connection established:', addr)
                }
            })

            helia.libp2p.addEventListener('connection:close', (evt) => {
                const addr = evt.detail.remoteAddr.toString()
                console.log('Connection closed to:', addr)
                if (addr.includes('/webrtc/')) {
                    console.log('❌ WebRTC connection lost:', addr)
                }
            })
            
            const orbit: OrbitDB =  await createOrbitDB({
                identity: {provider: identityProvider},
                ipfs: helia
            })

            const relay = `/dns4/ah-p2p.market/tcp/443/wss/p2p/16Uiu2HAm3TCXKkf8uBHsf1kL4TXC8325P7mxJUzPy8iskhewiyAV`
            await helia.libp2p.dial(multiaddr(relay))
            console.log('Dialed to relay, checking connection stability...')

            // Initialize PubsubService with minimal setup
            const pubsubService = new PubsubService(helia, orbit)
            await pubsubService.initialize()

            // Wait for WebRTC address and announce peer
            const waitForWebRTCAddress = new Promise<Multiaddr>((resolve) => {
                const interval = setInterval(() => {
                    const selfWebRTCMultiaddr = helia.libp2p.getMultiaddrs().find(ma => WebRTC.matches(ma))
                    if (selfWebRTCMultiaddr) {
                        clearInterval(interval)
                        resolve(selfWebRTCMultiaddr)
                    }
                }, 1000)
            })
            const selfWebRTCMultiaddr = await waitForWebRTCAddress
            pubsubService.announcePeer(selfWebRTCMultiaddr.toString())

            // Wait for peer list
            await pubsubService.waitForPeerList()

            // Log discovered peers periodically
            setInterval(() => {
                console.log('Logging peers')
                const peers = helia.libp2p.getPeers()
                const connections = helia.libp2p.getConnections()
                const webrtcConnections = connections.filter(conn => 
                    conn.remoteAddr.toString().includes('/webrtc/')
                )
                console.log(`Connected to ${peers.length} peers:`, peers.map(p => p.toString()))
                console.log(`Direct WebRTC connections: ${webrtcConnections.length}`)
                webrtcConnections.forEach(conn => {
                    console.log('  WebRTC:', conn.remoteAddr.toString())
                })
            }, 30000)

            setAHP2P({ helia, orbit, pubsubService })
            setStarting(false)
            setIsInitialized(true)

        } catch (error) {
            setError(true)
            console.error('Error starting Helia:', error)
        }
    }, [address, walletClient.data])

    useEffect(() => {
        if (!isInitialized) {
            startHelia()
        }
    }, [isInitialized])

    return (
        <HeliaContext.Provider value={{
            starting,
            error,
            AHP2P,
        }}>
            {children}
        </HeliaContext.Provider>
    )
}