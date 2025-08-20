import { useEffect, useRef, useState } from "react"
import { useAuctionRoom } from "@/hooks/useAuctionRoom"
import AuctionDetailsCard from "./AuctionDetailsCard"
import AuctionChat from "./AuctionChat"

export const Auction = () => {
    const watcherCleanupRef = useRef<(() => void) | null>(null)
    const [messages, setMessages] = useState<any>([])
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
            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Auction Details - Takes 2 columns on large screens */}
                <div className="xl:col-span-2">
                    <AuctionDetailsCard auction={auction} postBid={postBid} />
                </div>

                {/* Chat Interface - Takes 1 column on large screens */}
                <div className="xl:col-span-1">
                    <AuctionChat 
                        auctionId={auction?.id} 
                        room={room}
                        messages={messages}
                        postChatMessage={postChatMessage}
                    />
                </div>
            </div>

            {/* Additional Battle Stats Footer */}
            <div className="max-w-7xl mx-auto mt-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 text-center">
                        <div className="text-2xl mb-2">🎯</div>
                        <div className="text-lg font-bold text-cyan-400">Active</div>
                        <div className="text-sm text-slate-400">Battle Status</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 text-center">
                        <div className="text-2xl mb-2">⚡</div>
                        <div className="text-lg font-bold text-green-400">Real-time</div>
                        <div className="text-sm text-slate-400">Updates</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 text-center">
                        <div className="text-2xl mb-2">🛡️</div>
                        <div className="text-lg font-bold text-orange-400">Secure</div>
                        <div className="text-sm text-slate-400">P2P Network</div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 text-center">
                        <div className="text-2xl mb-2">🚀</div>
                        <div className="text-lg font-bold text-purple-400">Epic</div>
                        <div className="text-sm text-slate-400">Gaming UI</div>
                    </div>
                </div>
            </div>
        </div>
    )
}