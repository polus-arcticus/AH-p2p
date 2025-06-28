import { useParams, Link } from "react-router"
import { useContext, useState, useRef, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { HeliaContext } from '../providers/HeliaProvider'

export const Auction = () => {
    const { roomId } = useParams()
    const { address, isConnected } = useAccount()
    const { 
        peerId,
        chatMessages, 
        sendChatMessage, 
        currentRoom, 
        joinRoom, 
        leaveRoom, 
        roomPeers,
        activeAuctions,
        starting,
        error
    } = useContext(HeliaContext)
    
    // Find the auction details for this room
    const auction = activeAuctions.find(a => a.id === roomId)
    const isAuctioneer = auction && address && auction.creator === address.toLowerCase()
    const isAuctionEnded = auction && auction.endTime <= Date.now()
    
    // Get ERC20 token balance for bidding
    const { data: tokenBalance } = useBalance({
        address: address,
        token: auction?.tokenContract as `0x${string}` | undefined,
        query: {
            enabled: isConnected && !!auction?.tokenContract
        }
    })
    
    const [messageInput, setMessageInput] = useState('')
    const [bidAmount, setBidAmount] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [chatMessages])

    // Auto-join room when component mounts
    useEffect(() => {
        if (roomId && roomId !== currentRoom && !starting && !error) {
            joinRoom(roomId)
        }
    }, [roomId, currentRoom, joinRoom, starting, error])

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (messageInput.trim() && currentRoom) {
            sendChatMessage(messageInput, currentRoom)
            setMessageInput('')
        }
    }

    const handlePlaceBid = (e: React.FormEvent) => {
        e.preventDefault()
        if (bidAmount.trim() && currentRoom) {
            const bidMessage = `BID:${bidAmount}`
            sendChatMessage(bidMessage, currentRoom)
            setBidAmount('')
        }
    }

    if (starting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
                    <p className="text-white text-xl">Connecting to P2P Network...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-white text-xl">❌ Connection Failed</p>
                    <Link to="/" className="text-purple-300 hover:text-white transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                    {/* Auction Header */}
                    <div className="bg-black/30 p-6 border-b border-white/10">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                    <h2 className="text-2xl font-bold text-white">
                                        {auction?.title || `Auction Room: ${roomId}`}
                                    </h2>
                                    {isAuctioneer && (
                                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                                            AUCTIONEER
                                        </span>
                                    )}
                                    {isAuctionEnded && (
                                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                            ENDED
                                        </span>
                                    )}
                                </div>
                                
                                {auction && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-sm text-gray-400 mb-1">NFT Details</div>
                                            <div className="text-xs font-mono text-blue-400 mb-1">
                                                {auction.nftContract.slice(0, 10)}...{auction.nftContract.slice(-8)}
                                            </div>
                                            <div className="text-xs text-green-400">Token ID: {auction.nftTokenId}</div>
                                        </div>
                                        
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-sm text-gray-400 mb-1">Payment Token</div>
                                            <div className="text-xs font-mono text-yellow-400 mb-1">
                                                {auction.tokenContract.slice(0, 10)}...{auction.tokenContract.slice(-8)}
                                            </div>
                                            <div className="text-xs text-gray-300">
                                                Your Balance: {tokenBalance ? `${parseFloat(tokenBalance.formatted).toFixed(4)} ${tokenBalance.symbol}` : 'Loading...'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <p className="text-gray-300">
                                    {roomPeers[currentRoom || '']?.length || 0} participants active
                                    {auction && (
                                        <span className="ml-4">
                                            Starting bid: {auction.startingBid} • Ends: {new Date(auction.endTime).toLocaleString()}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <Link
                                to="/auctions"
                                onClick={() => leaveRoom()}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Leave Auction
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                        {/* Bidding Section */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Place Bid</h3>
                                
                                {!isConnected ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-400 mb-4">Connect your wallet to place bids</p>
                                        <div className="text-sm text-yellow-400">🔗 Use the Connect Wallet button above</div>
                                    </div>
                                ) : isAuctionEnded ? (
                                    <div className="text-center py-6">
                                        <p className="text-red-400 mb-2">🏁 Auction Ended</p>
                                        <div className="text-sm text-gray-400">Bidding is now closed</div>
                                    </div>
                                ) : isAuctioneer ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-400 mb-2">You are the auctioneer</p>
                                        <div className="text-sm text-purple-400">💼 You cannot bid on your own auction</div>
                                    </div>
                                ) : (
                                    <form onSubmit={handlePlaceBid} className="space-y-4">
                                        <div className="mb-2">
                                            <div className="text-sm text-gray-400 mb-1">
                                                Available: {tokenBalance ? `${parseFloat(tokenBalance.formatted).toFixed(4)} ${tokenBalance.symbol}` : 'Loading...'}
                                            </div>
                                            <div className="text-xs text-yellow-400">
                                                Minimum bid: {auction?.startingBid || '0'}
                                            </div>
                                        </div>
                                        
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            placeholder={`Enter bid amount (${tokenBalance?.symbol || 'ERC20'})`}
                                            className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                                            min={auction?.startingBid || '0'}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!bidAmount || parseFloat(bidAmount) < parseFloat(auction?.startingBid || '0')}
                                            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200"
                                        >
                                            🔨 Place Bid
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Auction Stats */}
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10 mt-4">
                                <h3 className="text-lg font-semibold text-white mb-4">Auction Stats</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Participants:</span>
                                        <span className="text-blue-400">{(roomPeers[currentRoom || '']?.length || 0) + 1}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Total Bids:</span>
                                        <span className="text-green-400">
                                            {chatMessages.filter(msg => msg.roomId === currentRoom && msg.message.startsWith('BID:')).length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Highest Bid:</span>
                                        <span className="text-yellow-400">
                                            {(() => {
                                                const bids = chatMessages
                                                    .filter(msg => msg.roomId === currentRoom && msg.message.startsWith('BID:'))
                                                    .map(msg => parseFloat(msg.message.slice(4)) || 0)
                                                return bids.length > 0 ? `${Math.max(...bids)} ${tokenBalance?.symbol || 'ERC20'}` : 'No bids yet'
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chat/Activity Feed */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                                <div className="bg-black/30 p-4 border-b border-white/10">
                                    <h3 className="text-lg font-semibold text-white">Auction Activity</h3>
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
                                                        {msg.message.startsWith('BID:') ? 
                                                            `🔨 Bid placed: ${msg.message.slice(4)} ${tokenBalance?.symbol || 'ERC20'}` : 
                                                            msg.message
                                                        }
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
                    </div>
                </div>
            </div>
        </div>
    )
}
