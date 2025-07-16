import type { Libp2p } from '@libp2p/interface'
import type {GossipSub}  from '@chainsafe/libp2p-gossipsub'
import type { AHP2PHelia } from '../types'
import type { OrbitDB } from '@orbitdb/core'
import { WebRTC } from '@multiformats/multiaddr-matcher'
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr'

export const TOPICS = {
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

export const getChatTopic = (roomId: string) => `ah-p2p.market/chat-room/${roomId}`

export interface ActiveAuction {
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

export interface ChatMessage {
    id: string
    peerId: string
    message: string
    timestamp: number
    roomId: string
}

export interface PubsubCallbacks {
    onChatMessage?: (message: ChatMessage) => void
    onRoomJoin?: (peerId: string, roomId: string) => void
    onRoomLeave?: (peerId: string, roomId: string) => void
    onActiveAuction?: (auction: ActiveAuction) => void
    onPeerList?: (peerList: Record<string, string>) => void
    onPong?: () => void
}

export class PubsubService {
    private helia : AHP2PHelia
    private orbit: OrbitDB
    private peerId: string | null = null
    private callbacks: PubsubCallbacks = {}
    private relay: string = '/dns4/ah-p2p.market/tcp/443/wss/p2p/16Uiu2HAm3TCXKkf8uBHsf1kL4TXC8325P7mxJUzPy8iskhewiyAV'
    private chatDB: any = null
    private auctionDB: any = null

    constructor(
        helia: AHP2PHelia,
        orbit: OrbitDB
    ) {
        this.helia = helia
        this.orbit = orbit
        this.peerId = helia.libp2p.peerId.toString()
        this.callbacks = {}
    }

    async initialize() {
        // Create OrbitDB databases for persistent state with consistent addresses
        this.chatDB = await this.orbit.open('ah-p2p-chat-global', { type: 'events' })
        this.auctionDB = await this.orbit.open('ah-p2p-auctions-global', { type: 'documents' })
        
        console.log('OrbitDB databases opened:')
        console.log('Chat DB address:', this.chatDB.address)
        console.log('Auction DB address:', this.auctionDB.address)
        
        // Set up replication listeners
        this.chatDB.events.on('join', (peerId: string, heads: any) => {
            console.log('Chat DB: Peer joined', peerId)
        })
        
        this.auctionDB.events.on('join', (peerId: string, heads: any) => {
            console.log('Auction DB: Peer joined', peerId)
        })
        
        // Add update listeners for real-time sync
        this.auctionDB.events.on('update', (entry: any) => {
            console.log('Auction DB updated:', entry)
        })
        
        this.chatDB.events.on('update', (entry: any) => {
            console.log('Chat DB updated:', entry)
        })
        
        this.subscribeToTopics()
        this.setupMessageHandlers()
        await this.waitForStableConnection()
        
        const waitForWebRTCAddress = new Promise<Multiaddr>((resolve) => {
            const interval = setInterval(() => {
                const selfWebRTCMultiaddr = this.libp2p.getMultiaddrs().find(ma => WebRTC.matches(ma))
                if (selfWebRTCMultiaddr) {
                    clearInterval(interval)
                    resolve(selfWebRTCMultiaddr)
                }
            }, 1000)
        })
        const selfWebRTCMultiaddr = await waitForWebRTCAddress
        this.announcePeer(selfWebRTCMultiaddr.toString())
        await this.waitForPeerList()
        
        // Wait a bit for initial replication
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log('PubsubService initialized with OrbitDB replication')
        
        // Periodically broadcast database addresses for peer discovery
        setInterval(() => {
            this.broadcastDatabaseAddresses()
        }, 30000) // Every 30 seconds
        
        // Initial broadcast
        this.broadcastDatabaseAddresses()
    }

    private get libp2p(): Libp2p {
        return this.helia.libp2p
    }

    private get pubsub(): GossipSub {
        return this.libp2p.services.pubsub as GossipSub
    }

    async sendChatMessage(message: string, roomId: string): Promise<boolean> {
        if (!this.helia || !message.trim() || !roomId || !this.chatDB) return false

        const chatMessage: ChatMessage = {
            id: Date.now().toString(),
            peerId: this.peerId || 'unknown',
            message: message.trim(),
            timestamp: Date.now(),
            roomId: roomId
        }
        
        try {
            // Store in OrbitDB for persistence
            await this.chatDB.add(chatMessage)
            
            // Also broadcast via pubsub for real-time updates
            this.pubsub.publish(getChatTopic(roomId), new TextEncoder().encode(JSON.stringify(chatMessage)))
            console.log(`Chat message stored in OrbitDB and broadcast to room ${roomId}`)
            return true
        } catch (error) {
            console.error('Failed to send chat message:', error)
            return false
        }
    }

    async getChatMessages(roomId: string): Promise<ChatMessage[]> {
        if (!this.chatDB) return []
        
        try {
            const iterator = this.chatDB.iterator()
            const messages: ChatMessage[] = []
            
            for await (const entry of iterator) {
                const message = entry.value as ChatMessage
                if (message.roomId === roomId) {
                    messages.push(message)
                }
            }
            
            return messages.sort((a, b) => a.timestamp - b.timestamp)
        } catch (error) {
            console.error('Failed to get chat messages:', error)
            return []
        }
    }

    async createAuction(auctionData: Omit<ActiveAuction, 'id' | 'creator' | 'createdAt' | 'currentHighBid' | 'bidCount'>, creatorAddress: string): Promise<string | undefined> {
        if (!this.helia || !this.peerId || !this.auctionDB) return undefined

        const auction: ActiveAuction = {
            ...auctionData,
            id: `auction-${Date.now()}`,
            creator: creatorAddress.toLowerCase(),
            createdAt: Date.now(),
            currentHighBid: auctionData.startingBid,
            bidCount: 0
        }
        
        try {
            // Store in OrbitDB for persistence - add _id field required by documents database
            const docWithId = {
                ...auction,
                _id: auction.id
            }
            await this.auctionDB.put(docWithId)
            
            // Broadcast via pubsub for real-time updates
            this.pubsub.publish(TOPICS.ACTIVE_AUCTIONS, new TextEncoder().encode(JSON.stringify(auction)))
            
            // Also broadcast database address for replication
            this.broadcastDatabaseAddresses()
            
            console.log('Auction stored in OrbitDB and broadcast:', auction)
            
            return auction.id
        } catch (error) {
            console.error('Failed to create auction:', error)
            return undefined
        }
    }

    // Broadcast database addresses for peer discovery
    broadcastDatabaseAddresses(): void {
        if (!this.auctionDB || !this.chatDB) return
        
        const dbInfo = {
            auctionDB: this.auctionDB.address,
            chatDB: this.chatDB.address,
            peerId: this.peerId
        }
        
        this.pubsub.publish('ah-p2p.market/db-addresses', new TextEncoder().encode(JSON.stringify(dbInfo)))
    }

    // Replicate with discovered databases
    async replicateWithPeer(dbAddresses: { auctionDB: string, chatDB: string, peerId: string }): Promise<void> {
        try {
            // Open the peer's databases for replication
            const peerAuctionDB = await this.orbit.open(dbAddresses.auctionDB)
            const peerChatDB = await this.orbit.open(dbAddresses.chatDB)
            
            console.log(`Replicating with peer ${dbAddresses.peerId}:`)
            console.log('- Auction DB:', dbAddresses.auctionDB)
            console.log('- Chat DB:', dbAddresses.chatDB)
        } catch (error) {
            console.error('Failed to replicate with peer:', error)
        }
    }

    async getActiveAuctions(): Promise<ActiveAuction[]> {
        if (!this.auctionDB) return []
        
        try {
            const iterator = this.auctionDB.iterator()
            const auctions: ActiveAuction[] = []
            
            for await (const entry of iterator) {
                const auction = entry.value as ActiveAuction
                // Only return auctions that haven't ended
                if (auction.endTime > Date.now()) {
                    auctions.push(auction)
                }
            }
            
            return auctions.sort((a, b) => b.createdAt - a.createdAt)
        } catch (error) {
            console.error('Failed to get active auctions:', error)
            return []
        }
    }

    joinRoom(roomId: string): void {
        if (!this.helia || !roomId) return

        this.pubsub.subscribe(getChatTopic(roomId))
        console.log(`Joined room: ${roomId}`)
        
        this.pubsub.publish(
            TOPICS.AUCTION_ROOM_JOIN,
            new TextEncoder().encode(JSON.stringify({ peerId: this.peerId, roomId }))
        )
    }

    leaveRoom(roomId: string): void {
        if (!this.helia || !roomId) return

        this.pubsub.publish(
            TOPICS.AUCTION_ROOM_LEAVE,
            new TextEncoder().encode(JSON.stringify({ peerId: this.peerId, roomId }))
        )
        
        this.pubsub.unsubscribe(getChatTopic(roomId))
        console.log(`Left room: ${roomId}`)
    }

    broadcastAuction(auction: ActiveAuction): void {
        if (!this.helia) return

        this.pubsub.publish(
            TOPICS.ACTIVE_AUCTIONS,
            new TextEncoder().encode(JSON.stringify(auction))
        )
    }

    announcePeer(multiaddr: string): void {
        if (!this.helia || !this.peerId) return

        this.pubsub.publish(TOPICS.PEER_ANNOUNCE, new TextEncoder().encode(JSON.stringify({
            peerId: this.peerId,
            multiaddrs: multiaddr
        })))
    }

    requestPeerList(): void {
        if (!this.helia) return

        this.pubsub.publish(TOPICS.PEER_REQUEST, new Uint8Array())
    }

    sendPing(): void {
        if (!this.helia) return

        this.pubsub.publish(TOPICS.PING, new Uint8Array())
    }

    subscribeToTopics(): void {
        if (!this.helia) return

        this.pubsub.subscribe(TOPICS.PONG)
        this.pubsub.subscribe(TOPICS.PEER_LIST)
        this.pubsub.subscribe(TOPICS.AUCTION_ROOM_JOIN)
        this.pubsub.subscribe(TOPICS.AUCTION_ROOM_LEAVE)
        this.pubsub.subscribe(TOPICS.ACTIVE_AUCTIONS)
        this.pubsub.subscribe(TOPICS.AUCTION_CREATE)
        this.pubsub.subscribe(TOPICS.AUCTION_END)
        this.pubsub.subscribe('ah-p2p.market/db-addresses')
    }

    setupMessageHandlers(): void {
        if (!this.helia) return

        const messageHandler = (evt: { detail: { topic: string, data: Uint8Array } }) => {
            const { topic, data } = evt.detail
            
            // Handle chat messages
            if (topic.startsWith('ah-p2p.market/chat-room/')) {
                try {
                    const chatMessage: ChatMessage = JSON.parse(new TextDecoder().decode(data))
                    if (chatMessage.peerId !== this.peerId) {
                        this.callbacks.onChatMessage?.(chatMessage)
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
                    this.callbacks.onRoomJoin?.(joinedPeerId, roomId)
                } catch (error) {
                    console.error('Failed to parse room join:', error)
                }
            }
            
            if (topic === TOPICS.AUCTION_ROOM_LEAVE) {
                try {
                    const { peerId: leftPeerId, roomId } = JSON.parse(new TextDecoder().decode(data))
                    console.log(`Peer ${leftPeerId} left room ${roomId}`)
                    this.callbacks.onRoomLeave?.(leftPeerId, roomId)
                } catch (error) {
                    console.error('Failed to parse room leave:', error)
                }
            }
            
            // Handle active auction broadcasts
            if (topic === TOPICS.ACTIVE_AUCTIONS) {
                try {
                    const auction: ActiveAuction = JSON.parse(new TextDecoder().decode(data))
                    console.log('Active auction broadcast received:', auction)
                    
                    if (auction.id && auction.title && auction.creator) {
                        this.callbacks.onActiveAuction?.(auction)
                    }
                } catch (error) {
                    console.error('Failed to parse active auction broadcast:', error)
                }
            }

            // Handle peer list
            if (topic === TOPICS.PEER_LIST) {
                try {
                    const peerList: Record<string, string> = JSON.parse(new TextDecoder().decode(data))
                    console.log('Peer list', peerList)
                    this.callbacks.onPeerList?.(peerList)
                } catch (error) {
                    console.error('Failed to parse peer list:', error)
                }
            }

            // Handle pong
            if (topic === TOPICS.PONG) {
                console.log('Received pong - connection is stable')
                this.callbacks.onPong?.()
            }

            // Handle database address broadcasts
            if (topic === 'ah-p2p.market/db-addresses') {
                try {
                    const dbInfo = JSON.parse(new TextDecoder().decode(data))
                    if (dbInfo.peerId !== this.peerId) {
                        console.log('Received database addresses from peer:', dbInfo.peerId)
                        this.replicateWithPeer(dbInfo)
                    }
                } catch (error) {
                    console.error('Failed to parse database addresses:', error)
                }
            }
        }

        this.pubsub.addEventListener('message', messageHandler)
    }

    async waitForStableConnection(): Promise<void> {
        if (!this.helia) return

        return new Promise<void>((resolve) => {
            let pingInterval: NodeJS.Timeout | null = null
            
            const pongListener = (evt: { detail: { topic: string, data: Uint8Array } }) => {
                const { topic } = evt.detail
                if (topic === TOPICS.PONG) {
                    if (pingInterval) {
                        clearInterval(pingInterval)
                        pingInterval = null
                    }
                    this.pubsub.removeEventListener('message', pongListener)
                    resolve()
                }
            }

            this.pubsub.addEventListener('message', pongListener)

            pingInterval = setInterval(() => {
                console.log('Sending ping')
                this.sendPing()
            }, 1000)
        })
    }

    async waitForPeerList(): Promise<Record<string, string>> {
        if (!this.helia) return {}

        return new Promise<Record<string, string>>((resolve) => {
            const peerListListener = (evt: { detail: { topic: string, data: Uint8Array } }) => {
                const { topic, data } = evt.detail
                if (topic === TOPICS.PEER_LIST) {
                    const peerListJson: Record<string, string> = JSON.parse(new TextDecoder().decode(data))
                    console.log('Peer list', peerListJson)
                    delete peerListJson[this.peerId!]
                    this.pubsub.removeEventListener('message', peerListListener)
                    resolve(peerListJson)
                }
            }
            
            this.pubsub.addEventListener('message', peerListListener)
            this.pubsub.subscribe(TOPICS.PEER_LIST)
            this.pubsub.publish(TOPICS.PEER_REQUEST, new Uint8Array())
        })
    }
} 