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
import { useAccount } from 'wagmi'

import { WebRTC } from '@multiformats/multiaddr-matcher'
import * as filters from '@libp2p/websockets/filters'
import type { Libp2p } from 'libp2p'
import type { Helia, HeliaLibp2p } from 'helia'
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
    PONG: 'ah-p2p.market/pong',
    CHAT: 'ah-p2p.market/chat',
    AUCTION_ROOM_JOIN: 'ah-p2p.market/auction-room-join',
    AUCTION_ROOM_LEAVE: 'ah-p2p.market/auction-room-leave',
    ACTIVE_AUCTIONS: 'ah-p2p.market/active-auctions',
    AUCTION_CREATE: 'ah-p2p.market/auction-create',
    AUCTION_END: 'ah-p2p.market/auction-end'
}

const getChatTopic = (roomId: string) => `ah-p2p.market/chat-room/${roomId}`

interface ActiveAuction {
    id: string
    creator: string
    title: string
    description: string
    nftContract: string
    nftTokenId: string
    tokenContract: string
    startingBid: string
    currentHighBid: string
    bidCount: number
    endTime: number
    createdAt: number
    signature?: string
    sigHash?: string
}

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
})

export const HeliaProvider = ({ children }: { children: ReactNode }) => {
    const { address } = useAccount()
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

    const sendChatMessage = (message: string, roomId: string) => {
        if (helia && message.trim() && roomId) {
            // Check if we have direct WebRTC connections
            const connections = (helia as any).libp2p.getConnections()
            const webrtcConnections = connections.filter((conn: any) => 
                conn.remoteAddr.toString().includes('/webrtc/')
            )
            
            if (webrtcConnections.length === 0) {
                console.warn('No direct WebRTC connections available for chat')
                return
            }
            
            const chatMessage = {
                id: Date.now().toString(),
                peerId: peerId || 'unknown',
                message: message.trim(),
                timestamp: Date.now(),
                roomId: roomId
            }
            
            try {
                console.log(`Sending chat message to room ${roomId} over ${webrtcConnections.length} WebRTC connections`)
                ;(helia as any).libp2p.services.pubsub.publish(
                    getChatTopic(roomId), 
                    new TextEncoder().encode(JSON.stringify(chatMessage))
                )
                // Add our own message to the chat
                setChatMessages(prev => [...prev, chatMessage])
            } catch (error) {
                console.error('Failed to send chat message:', error)
            }
        }
    }

    const joinRoom = (roomId: string) => {
        if (helia && roomId) {
            setCurrentRoom(roomId)
            // Subscribe to room chat
            ;(helia as any).libp2p.services.pubsub.subscribe(getChatTopic(roomId))
            console.log(`Joined room: ${roomId}`)
            
            // Announce joining
            ;(helia as any).libp2p.services.pubsub.publish(
                TOPICS.AUCTION_ROOM_JOIN,
                new TextEncoder().encode(JSON.stringify({ peerId: peerId, roomId }))
            )
        }
    }

    const leaveRoom = () => {
        if (helia && currentRoom) {
            // Announce leaving
            ;(helia as any).libp2p.services.pubsub.publish(
                TOPICS.AUCTION_ROOM_LEAVE,
                new TextEncoder().encode(JSON.stringify({ peerId: peerId, roomId: currentRoom }))
            )
            
            // Unsubscribe from room chat
            ;(helia as any).libp2p.services.pubsub.unsubscribe(getChatTopic(currentRoom))
            console.log(`Left room: ${currentRoom}`)
            setCurrentRoom(null)
        }
    }

    const createAuction = (auctionData: Omit<ActiveAuction, 'id' | 'creator' | 'createdAt' | 'currentHighBid' | 'bidCount'>) => {
        if (helia && peerId && address) {
            const auction: ActiveAuction = {
                ...auctionData,
                id: `auction-${Date.now()}`,
                creator: address.toLowerCase(),
                createdAt: Date.now(),
                currentHighBid: auctionData.startingBid,
                bidCount: 0
            }
            
            console.log('Creating auction:', auction)
            
            // Broadcast auction on ACTIVE_AUCTIONS channel
            ;(helia as any).libp2p.services.pubsub.publish(
                TOPICS.ACTIVE_AUCTIONS,
                new TextEncoder().encode(JSON.stringify(auction))
            )
            
            // Add to our local list
            setActiveAuctions(prev => [...prev, auction])
            
            // Set up periodic broadcasting for this auction (every 30 seconds)
            const broadcastInterval = setInterval(() => {
                if (helia && auction.endTime > Date.now()) {
                    console.log('Periodic broadcast for auction:', auction.id)
                    ;(helia as any).libp2p.services.pubsub.publish(
                        TOPICS.ACTIVE_AUCTIONS,
                        new TextEncoder().encode(JSON.stringify(auction))
                    )
                } else {
                    // Auction ended, stop broadcasting
                    clearInterval(broadcastInterval)
                }
            }, 30000) // 30 seconds
            
            return auction.id
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

            // Create a promise that resolves when we get a pong
            const waitForStableConnection = new Promise<void>((resolve) => {
                let pingInterval: NodeJS.Timeout | null = null
                helia.libp2p.services.pubsub.subscribe(TOPICS.PONG)
                const pongListener = (evt: { detail: { topic: string, data: Uint8Array } }) => {
                    const { topic, data } = evt.detail
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
                    const selfWebRTCMultiaddr = helia.libp2p.getMultiaddrs().find(ma => WebRTC.matches(ma))
                    console.log('WebRTC Multiaddr', selfWebRTCMultiaddr?.toString())
                    if (selfWebRTCMultiaddr) {
                        clearInterval(interval)
                        resolve(selfWebRTCMultiaddr)
                    }
                }, 1000)
            })
            const selfWebRTCMultiaddr = await waitForWebRTCAddress
            console.log('WebRTC Multiaddr', selfWebRTCMultiaddr.toString())
            helia.libp2p.services.pubsub.publish(TOPICS.PEER_ANNOUNCE, new TextEncoder().encode(JSON.stringify({
                peerId: helia.libp2p.peerId.toString(),
                multiaddrs: selfWebRTCMultiaddr.toString()
            })))

            const subscribeToPeerList = new Promise<Record<string, string>>((resolve) => {
                const peerListListener = async (evt: { detail: { topic: string, data: Uint8Array } }) => {
                    const { topic, data } = evt.detail
                    if (topic === TOPICS.PEER_LIST) {
                        const peerListJson: Record<string, string> = JSON.parse(new TextDecoder().decode(data))
                        console.log('Peer list', peerListJson)
                        delete peerListJson[helia.libp2p.peerId.toString()]
                        setPeerList(peerListJson)
                        
                        // Dial WebRTC connections to peers
                        for (const [peerId, webrtcMultiaddr] of Object.entries(peerListJson)) {
                            console.log('Dialing WebRTC connection to peer:', peerId)
                            try {
                                await helia.libp2p.dial(multiaddr(webrtcMultiaddr))
                                console.log('Successfully established WebRTC connection to:', peerId)
                            } catch (error) {
                                console.error('Failed to dial WebRTC connection to', peerId, error)
                            }
                        }
                        
                        resolve(peerListJson)
                    }
                }
                helia.libp2p.services.pubsub.addEventListener('message', peerListListener)
                helia.libp2p.services.pubsub.subscribe(TOPICS.PEER_LIST)
                helia.libp2p.services.pubsub.publish(TOPICS.PEER_REQUEST, new Uint8Array())
            })

            const peerListJson = await subscribeToPeerList

            // Subscribe to room management and auction topics
            helia.libp2p.services.pubsub.subscribe(TOPICS.AUCTION_ROOM_JOIN)
            helia.libp2p.services.pubsub.subscribe(TOPICS.AUCTION_ROOM_LEAVE)
            helia.libp2p.services.pubsub.subscribe(TOPICS.ACTIVE_AUCTIONS)
            helia.libp2p.services.pubsub.subscribe(TOPICS.AUCTION_CREATE)
            helia.libp2p.services.pubsub.subscribe(TOPICS.AUCTION_END)
            
            const roomAndChatListener = (evt: { detail: { topic: string, data: Uint8Array } }) => {
                const { topic, data } = evt.detail
                
                // Handle room chat messages
                if (topic.startsWith('ah-p2p.market/chat-room/')) {
                    try {
                        const chatMessage = JSON.parse(new TextDecoder().decode(data))
                        // Only add messages from other peers (not our own)
                        if (chatMessage.peerId !== helia.libp2p.peerId.toString()) {
                            setChatMessages(prev => [...prev, chatMessage])
                        }
                    } catch (error) {
                        console.error('Failed to parse chat message:', error)
                    }
                }
                
                // Handle room join/leave
                if (topic === TOPICS.AUCTION_ROOM_JOIN) {
                    try {
                        const { peerId: joinedPeerId, roomId } = JSON.parse(new TextDecoder().decode(data))
                        console.log(`Peer ${joinedPeerId} joined room ${roomId}`)
                        setRoomPeers(prev => ({
                            ...prev,
                            [roomId]: [...(prev[roomId] || []), joinedPeerId].filter((p, i, arr) => arr.indexOf(p) === i)
                        }))
                    } catch (error) {
                        console.error('Failed to parse room join:', error)
                    }
                }
                
                if (topic === TOPICS.AUCTION_ROOM_LEAVE) {
                    try {
                        const { peerId: leftPeerId, roomId } = JSON.parse(new TextDecoder().decode(data))
                        console.log(`Peer ${leftPeerId} left room ${roomId}`)
                        setRoomPeers(prev => ({
                            ...prev,
                            [roomId]: (prev[roomId] || []).filter(p => p !== leftPeerId)
                        }))
                    } catch (error) {
                        console.error('Failed to parse room leave:', error)
                    }
                }
                
                // Handle active auction broadcasts
                if (topic === TOPICS.ACTIVE_AUCTIONS) {
                    try {
                        const auction = JSON.parse(new TextDecoder().decode(data))
                        console.log('Active auction broadcast received:', auction)
                        
                        // Validate it looks like an auction object
                        if (auction.id && auction.title && auction.creator) {
                            setActiveAuctions(prev => {
                                // Upsert: update if exists, add if new
                                const existingIndex = prev.findIndex(a => a.id === auction.id)
                                if (existingIndex >= 0) {
                                    // Update existing auction
                                    const updated = [...prev]
                                    updated[existingIndex] = auction
                                    return updated
                                } else {
                                    // Add new auction
                                    return [...prev, auction]
                                }
                            })
                        }
                    } catch (error) {
                        console.error('Failed to parse active auction broadcast:', error)
                    }
                }
            }
            helia.libp2p.services.pubsub.addEventListener('message', roomAndChatListener)

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
            setStarting(false)
            setIsInitialized(true)

        } catch (error) {
            setError(true)
            console.error('Error starting Helia:', error)
        }
    }

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
        }}>
            {children}
        </HeliaContext.Provider>
    )
}