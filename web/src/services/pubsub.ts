import type { Helia } from 'helia'
import type { Libp2p } from 'libp2p'

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
    private helia: Helia | null = null
    private peerId: string | null = null
    private callbacks: PubsubCallbacks = {}

    constructor(helia: Helia, peerId: string, callbacks: PubsubCallbacks = {}) {
        this.helia = helia
        this.peerId = peerId
        this.callbacks = callbacks
    }

    private get libp2p(): Libp2p {
        return (this.helia as any).libp2p
    }

    private get pubsub() {
        return this.libp2p.services.pubsub
    }

    sendChatMessage(message: string, roomId: string): boolean {
        if (!this.helia || !message.trim() || !roomId) return false

        const connections = this.libp2p.getConnections()
        const webrtcConnections = connections.filter((conn: any) => 
            conn.remoteAddr.toString().includes('/webrtc/')
        )
        
        if (webrtcConnections.length === 0) {
            console.warn('No direct WebRTC connections available for chat')
            return false
        }
        
        const chatMessage: ChatMessage = {
            id: Date.now().toString(),
            peerId: this.peerId || 'unknown',
            message: message.trim(),
            timestamp: Date.now(),
            roomId: roomId
        }
        
        try {
            console.log(`Sending chat message to room ${roomId} over ${webrtcConnections.length} WebRTC connections`)
            this.pubsub.publish(getChatTopic(roomId), new TextEncoder().encode(JSON.stringify(chatMessage)))
            return true
        } catch (error) {
            console.error('Failed to send chat message:', error)
            return false
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

    createAuction(auctionData: Omit<ActiveAuction, 'id' | 'creator' | 'createdAt' | 'currentHighBid' | 'bidCount'>, creatorAddress: string): string | undefined {
        if (!this.helia || !this.peerId) return undefined

        const auction: ActiveAuction = {
            ...auctionData,
            id: `auction-${Date.now()}`,
            creator: creatorAddress.toLowerCase(),
            createdAt: Date.now(),
            currentHighBid: auctionData.startingBid,
            bidCount: 0
        }
        
        console.log('Creating auction:', auction)
        
        this.pubsub.publish(
            TOPICS.ACTIVE_AUCTIONS,
            new TextEncoder().encode(JSON.stringify(auction))
        )
        
        return auction.id
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