import { useState, useRef, useEffect } from 'react'
import { useTokenData } from '../../hooks/useTokenData'
import { useAuctionData } from '../../hooks/useAuctionData'
import { useAuctionRoom } from '../../hooks/useAuctionRoom'
import { useSignedBids } from '../../hooks/useSignedBids'

interface ActivityFeedProps {
    roomId: string | undefined
}

export const ActivityFeed = ({ roomId }: ActivityFeedProps) => {
    const { auction, isAuctioneer } = useAuctionData(roomId)
    const { tokenBalance } = useTokenData(auction)
    const { chatMessages, currentRoom, peerId, sendChatMessage } = useAuctionRoom(roomId)
    const { bidCount } = useSignedBids(chatMessages, currentRoom)
    const [messageInput, setMessageInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [chatMessages])

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (messageInput.trim() && currentRoom) {
            sendChatMessage(messageInput, currentRoom)
            setMessageInput('')
        }
    }

    return (
        <div className="lg:col-span-2">
            <div className={`bg-white/5 rounded-lg border ${isAuctioneer ? 'border-purple-500/30' : 'border-white/10'} overflow-hidden`}>
                <div className="bg-black/30 p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-white">Auction Activity</h3>
                            {isAuctioneer && (
                                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                                    COLLECTING BIDS
                                </span>
                            )}
                        </div>
                        {isAuctioneer && (
                            <div className="text-sm text-purple-300">
                                {bidCount} signed bids collected
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="h-96 overflow-y-auto p-4 space-y-3">
                    {chatMessages
                        .filter(msg => msg.roomId === currentRoom)
                        .map((msg) => (
                            <div key={msg.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {msg.peerId.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-300 text-sm font-medium">
                                            {msg.peerId === peerId ? 'You' : `${msg.peerId.slice(0, 8)}...${msg.peerId.slice(-4)}`}
                                        </span>
                                        <span className="text-gray-500 text-xs">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className={`text-white ${msg.message.startsWith('BID:') ? 'font-bold text-yellow-400' : ''}`}>
                                        {msg.message.startsWith('BID:') ? (() => {
                                            // Parse signed bid format: BID:amount:SIGNED:jsonData
                                            const parts = msg.message.split(':')
                                            if (parts.length >= 2 && parts[2] === 'SIGNED') {
                                                const bidAmount = parts[1]
                                                return `🔨 Signed Bid: ${bidAmount} ${tokenBalance?.symbol || 'ERC20'}`
                                            } else {
                                                // Legacy format
                                                return `🔨 Bid placed: ${msg.message.slice(4)} ${tokenBalance?.symbol || 'ERC20'}`
                                            }
                                        })() : msg.message}
                                    </div>
                                </div>
                            </div>
                        ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-white/10">
                    <form onSubmit={handleSendMessage} className="p-4">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Send a message..."
                                className="flex-1 p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
} 