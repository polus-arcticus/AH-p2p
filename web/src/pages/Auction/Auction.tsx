import { useEffect, useRef, useState } from "react"
import { useAuctionRoom } from "@/hooks/useAuctionRoom"
import AuctionDetailsCard from "./AuctionDetailsCard"
import AuctionChat from "./AuctionChat"
import { NFTBalanceCard } from "./NFTBalanceCard"
import { TokenBalanceCard } from "./TokenBalanceCard"

export const Auction = () => {
    const watcherCleanupRef = useRef<(() => void) | null>(null)
    const [messages, setMessages] = useState<any>([])
    const [highBid, setHighBid] = useState<string>('0')
    const { 
        auction, 
        room, 
        postChatMessage, 
        postBid,
        fetchMessages, 
        watchRoom
    } = useAuctionRoom()
    
    useEffect(() => {
        console.log('Auction.tsx::auction', auction)
    }, [auction])
    
    // Load initial messages when room is available
    useEffect(() => {
        const loadMessages = async () => {
            let highestBid = 0
            if (!room) return
            
            try {
                console.log('🎯 Loading initial battle messages...')
                const roomMessages = await fetchMessages()
                if (roomMessages) {
                    const formattedMessages = roomMessages
                        .filter((msg: any) => {
                            const msgData = msg.value || msg
                            return msgData.type === 'message' || msgData.type === 'bid'
                        })
                        .map((msg: any) => {
                            const msgData = msg.value || msg
                            if (msgData.type === 'bid') {
                                if (!highestBid || Number(msgData.bid) > highestBid) {
                                    highestBid = Number(msgData.bid)
                                }
                            }
                            return {
                                id: msgData._id || msgData.timestamp?.toString() || Date.now().toString(),
                                user: msgData.user || 'Anonymous Warrior',
                                message: msgData.message || msgData.bid || '',
                                timestamp: msgData.timestamp || Date.now(),
                                type: msgData.type as 'message' | 'bid',
                                avatar: msgData.type === 'bid' ? '💰' : '⚔️'
                            }
                        })
                        .sort((a: any, b: any) => a.timestamp - b.timestamp)
                    
                    setMessages(formattedMessages)
                    setHighBid(highestBid.toString())
                    console.log('⚡ Loaded', formattedMessages.length, 'battle messages')
                }
            } catch (error) {
                console.error('❌ Failed to load battle messages:', error)
            }
        }
        
        loadMessages()
    }, [room, fetchMessages])

    useEffect(() => {
        console.log('room', room)
        if (room) {
            // Clean up previous watcher if exists
            if (watcherCleanupRef.current) {
                watcherCleanupRef.current()
                watcherCleanupRef.current = null
            }
            
            // Start watching room for updates (messages, bids, etc.)
            const cleanup = watchRoom((event) => {
                console.log('🎮 Auction room update:', event)
                
                // Handle new messages/bids from room updates
                if (event && event.payload) {
                    const msgData = event.payload.value || event.payload
                    
                    if (msgData.type === 'bid') {
                        if (!highBid || Number(msgData.bid) > Number(highBid)) {
                            setHighBid(msgData.bid)
                        }
                    }
                    // Only process message and bid types
                    if (msgData.type === 'message' || msgData.type === 'bid') {
                        const newMessage = {
                            id: msgData._id || msgData.timestamp?.toString() || Date.now().toString(),
                            user: msgData.user || 'Anonymous Warrior',
                            message: msgData.message || msgData.bid || '',
                            timestamp: msgData.timestamp || Date.now(),
                            type: msgData.type as 'message' | 'bid',
                            avatar: msgData.type === 'bid' ? '💰' : '⚔️'
                        }
                        
                        // Add new message to the list (avoid duplicates)
                        setMessages(prevMessages => {
                            const exists = prevMessages.some(msg => msg.id === newMessage.id)
                            if (exists) return prevMessages
                            
                            const updatedMessages = [...prevMessages, newMessage]
                            return updatedMessages.sort((a, b) => a.timestamp - b.timestamp)
                        })
                        
                        console.log('⚡ New battle message added:', newMessage.message)
                    }
                }
            })
            
            watcherCleanupRef.current = cleanup || null
            
            return () => {
                if (watcherCleanupRef.current) {
                    watcherCleanupRef.current()
                    watcherCleanupRef.current = null
                }
            }
        }
    }, [room, watchRoom])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            {/* Epic Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="text-center py-8">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
                        ⚔️ Battle Arena Dashboard
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Welcome to the ultimate P2P auction battleground! Monitor your battles, place strategic bids, and communicate with fellow warriors in real-time.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-xl">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-400 font-semibold">Arena Online</span>
                        </div>
                        {room?.address && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-xl">
                                <span className="text-slate-400">🌐 Room:</span>
                                <span className="text-cyan-400 font-mono text-sm">{room.address.slice(0, 8)}...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="max-w-7xl mx-auto space-y-8">
                {/* All Cards in Single Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Auction Details Card - Compressed */}
                    <AuctionDetailsCard auction={auction} postBid={postBid} highBid={highBid} />
                    
                    {/* NFT Balance Card */}
                    <NFTBalanceCard auction={auction} />
                    
                    {/* Token Balance Card */}
                    <TokenBalanceCard auction={auction} />
                </div>

                {/* Chat Interface - Full Width */}
                <div className="w-full">
                    <AuctionChat 
                        auctionId={auction?.id} 
                        room={room}
                        messages={messages}
                        postChatMessage={postChatMessage}
                    />
                </div>
            </div>

        </div>
    )
}