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
import type { Libp2p } from 'libp2p'
import type { Helia, HeliaLibp2p } from 'helia'
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr'
import { WebRTC as WebRTCMatcher } from '@multiformats/multiaddr-matcher'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

import { createOrbitDB, useIdentityProvider } from '@orbitdb/core'
import * as OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'
import { getWalletInterface } from '../utils/blockchain'
import { PubsubService, TOPICS, getChatTopic, type ActiveAuction, type ChatMessage } from '../services/pubsub'

export const HeliaContext = createContext({
    peerId: null as string | null,
    libp2p: null as Libp2p | null,
    helia: null as Helia | null,
    error: false,
    starting: true,
    startHelia: async () => { },
    peerList: {} as { [peerId: string]: string },
    chatMessages: [] as Array<{ id: string, peerId: string, message: string, timestamp: number, roomId: string }>,
    sendChatMessage: (message: string, roomId: string) => { },
    webrtcConnectionCount: 0,
    currentRoom: null as string | null,
    joinRoom: (roomId: string) => { },
    leaveRoom: () => { },
    roomPeers: {} as { [roomId: string]: string[] },
    activeAuctions: [] as ActiveAuction[],
    createAuction: (auction: Omit<ActiveAuction, 'id' | 'creator' | 'createdAt' | 'currentHighBid' | 'bidCount'>) => '' as string | undefined,
    refreshActiveAuctions: () => { },
    orbit: null,
    startOrbit: async () => { },
})

export const HeliaProvider = ({ children }: { children: ReactNode }) => {
    useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
    const { address } = useAccount()
    const walletClient = useWalletClient()
    const [peerId, setPeerId] = useState<string | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [libp2p, setLibp2p] = useState<Libp2p | null>(null)
    const [helia, setHelia] = useState<Helia | null>(null)
    const [error, setError] = useState(false)
    const [starting, setStarting] = useState(true)
    const [peerList, setPeerList] = useState<{ [peerId: string]: string }>({})
    const [chatMessages, setChatMessages] = useState<Array<{ id: string, peerId: string, message: string, timestamp: number, roomId: string }>>([])
    const [webrtcConnectionCount, setWebrtcConnectionCount] = useState(0)
    const [currentRoom, setCurrentRoom] = useState<string | null>(null)
    const [roomPeers, setRoomPeers] = useState<{ [roomId: string]: string[] }>({})
    const [activeAuctions, setActiveAuctions] = useState<ActiveAuction[]>([])
    const [orbit, setOrbit] = useState<any | null>(null)
    const [pubsubService, setPubsubService] = useState<PubsubService | null>(null)

    const sendChatMessage = (message: string, roomId: string) => {
        if (pubsubService && message.trim() && roomId) {
            const success = pubsubService.sendChatMessage(message, roomId)
            if (success) {
                // Add our own message to the chat
                const chatMessage: ChatMessage = {
                    id: Date.now().toString(),
                    peerId: peerId || 'unknown',
                    message: message.trim(),
                    timestamp: Date.now(),
                    roomId: roomId
                }
                setChatMessages(prev => [...prev, chatMessage])
            }
        }
    }

    const joinRoom = (roomId: string) => {
        if (pubsubService && roomId) {
            setCurrentRoom(roomId)
            pubsubService.joinRoom(roomId)
        }
    }

    const leaveRoom = () => {
        if (pubsubService && currentRoom) {
            pubsubService.leaveRoom(currentRoom)
            setCurrentRoom(null)
        }
    }

    const createAuction = (auctionData: Omit<ActiveAuction, 'id' | 'creator' | 'createdAt' | 'currentHighBid' | 'bidCount'>) => {
        if (pubsubService && peerId && address) {
            const auctionId = pubsubService.createAuction(auctionData, address)
            
            if (auctionId) {
                const auction: ActiveAuction = {
                    ...auctionData,
                    id: auctionId,
                    creator: address.toLowerCase(),
                    createdAt: Date.now(),
                    currentHighBid: auctionData.startingBid,
                    bidCount: 0
                }
                
                // Add to our local list
                setActiveAuctions(prev => [...prev, auction])
                
                // Set up periodic broadcasting for this auction (every 30 seconds)
                const broadcastInterval = setInterval(() => {
                    if (pubsubService && auction.endTime > Date.now()) {
                        pubsubService.broadcastAuction(auction)
                    } else {
                        // Auction ended, stop broadcasting
                        clearInterval(broadcastInterval)
                    }
                }, 30000) // 30 seconds
                
                return auctionId
            }
        }
    }

    const refreshActiveAuctions = () => {
        if (helia) {
            console.log('Refreshing active auctions - listening for broadcasts...')
            // Just listen - auctions will be broadcast by their creators
            // No need to actively request, creators will periodically broadcast
        }
    }
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
            const helia = await createHelia({ libp2p, datastore, blockstore })
            setPeerId(helia.libp2p.peerId.toString())

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

            const relay = `/dns4/ah-p2p.market/tcp/443/wss/p2p/16Uiu2HAm3TCXKkf8uBHsf1kL4TXC8325P7mxJUzPy8iskhewiyAV`
            await helia.libp2p.dial(multiaddr(relay))
            console.log('Dialed to relay, checking connection stability...')

            // Initialize PubsubService
            const pubsubCallbacks = {
                onChatMessage: (message: ChatMessage) => {
                    setChatMessages(prev => [...prev, message])
                },
                onRoomJoin: (joinedPeerId: string, roomId: string) => {
                    console.log(`Peer ${joinedPeerId} joined room ${roomId}`)
                    setRoomPeers(prev => ({
                        ...prev,
                        [roomId]: [...(prev[roomId] || []), joinedPeerId].filter((p, i, arr) => arr.indexOf(p) === i)
                    }))
                },
                onRoomLeave: (leftPeerId: string, roomId: string) => {
                    console.log(`Peer ${leftPeerId} left room ${roomId}`)
                    setRoomPeers(prev => ({
                        ...prev,
                        [roomId]: (prev[roomId] || []).filter(p => p !== leftPeerId)
                    }))
                },
                onActiveAuction: (auction: ActiveAuction) => {
                    console.log('Active auction broadcast received:', auction)
                    setActiveAuctions(prev => {
                        const existingIndex = prev.findIndex(a => a.id === auction.id)
                        if (existingIndex >= 0) {
                            const updated = [...prev]
                            updated[existingIndex] = auction
                            return updated
                        } else {
                            return [...prev, auction]
                        }
                    })
                },
                onPeerList: (peerListJson: Record<string, string>) => {
                    console.log('Peer list', peerListJson)
                    delete peerListJson[helia.libp2p.peerId.toString()]
                    setPeerList(peerListJson)
                    
                    // Dial WebRTC connections to peers
                    for (const [peerId, webrtcMultiaddr] of Object.entries(peerListJson)) {
                        console.log('Dialing WebRTC connection to peer:', peerId)
                        helia.libp2p.dial(multiaddr(webrtcMultiaddr)).catch(error => {
                            console.error('Failed to dial WebRTC connection to', peerId, error)
                        })
                    }
                },
                onPong: () => {
                    console.log('Received pong - connection is stable')
                }
            }

            const pubsubService = new PubsubService(helia, helia.libp2p.peerId.toString(), pubsubCallbacks)
            pubsubService.subscribeToTopics()
            pubsubService.setupMessageHandlers()

            // Wait for stable connection
            await pubsubService.waitForStableConnection()

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

            setLibp2p(libp2p)
            setHelia(helia)
            setPubsubService(pubsubService)
            setStarting(false)
            setIsInitialized(true)

        } catch (error) {
            setError(true)
            console.error('Error starting Helia:', error)
        }
    }

    const startOrbit = useCallback(async () => {
        console.log('Starting OrbitDB')
        if (!helia || !address || !walletClient.data) return

        const identityProvider = OrbitDBIdentityProviderEthereum.default({
            wallet: getWalletInterface({
                address,
                walletClient: walletClient.data
            })
        })

        const orbit =  await createOrbitDB({
            identity: {provider: identityProvider},
            ipfs: helia
        })
        setOrbit(orbit)
        console.log('OrbitDB started')
    }, [helia, address, walletClient.data])

    useEffect(() => {
        if (!isInitialized) {
            startHelia()
        }
    }, [isInitialized])

    // Simple peer connection logging
    useEffect(() => {
        if (helia && Object.keys(peerList).length > 0) {
            console.log('Active peers for chat:', Object.keys(peerList))
        }
    }, [peerList, helia])

    useEffect(() => {
        if (helia && address) {
            startOrbit()
        }
    }, [helia, address])

    return (
        <HeliaContext.Provider value={{
            peerId,
            libp2p,
            helia,
            error,
            starting,
            startHelia,
            peerList,
            chatMessages,
            sendChatMessage,
            webrtcConnectionCount,
            currentRoom,
            joinRoom,
            leaveRoom,
            roomPeers,
            activeAuctions,
            createAuction,
            refreshActiveAuctions,
            orbit,
            startOrbit,
        }}>
            {children}
        </HeliaContext.Provider>
    )
}