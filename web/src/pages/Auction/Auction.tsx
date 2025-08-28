import { useEffect, useRef, useState } from "react"
import { useAuctionRoom } from "@/hooks/useAuctionRoom"
import { useAuctionsDB } from "@/hooks/useAuctionsDB"
import { useParams } from "react-router"
import AuctionDetailsCard from "./AuctionDetailsCard"
import AuctionChat from "./AuctionChat"
import { NFTBalanceCard } from "./NFTBalanceCard"
import { TokenBalanceCard } from "./TokenBalanceCard"
import { SuccessModal } from "../../components/SuccessModal"

export const Auction = () => {
    const { auctionId } = useParams()
    const watcherCleanupRef = useRef<(() => void) | null>(null)
    const [messages, setMessages] = useState<any>([])
    const [highBid, setHighBid] = useState<string>('0')
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
    const [auctionResult, setAuctionResult] = useState<{ winnerAddress?: string; finalBid?: string; nftName?: string } | null>(null)
    const [auctionCompleted, setAuctionCompleted] = useState<boolean>(false)
    const [auction, setAuction] = useState<any>(null)
    const [auctionError, setAuctionError] = useState<string | null>(null)
    
    // Separate hooks for auction data and room functionality
    const { getAuction } = useAuctionsDB()
    const { 
        room, 
        roomError,
        postChatMessage, 
        postBid,
        fetchMessages, 
        watchRoom,
        consumeAuction,
        completeAuction
    } = useAuctionRoom()
    
    // Load auction data independently of room
    useEffect(() => {
        if (!auctionId) return
        
        const loadAuction = async () => {
            try {
                setAuctionError(null)
                const auctionData = await getAuction(auctionId)
                if (auctionData) {
                    setAuction(auctionData)
                    console.log('Auction.tsx::auction loaded', auctionData)
                } else {
                    setAuctionError('Auction not found')
                }
            } catch (error) {
                console.error('Failed to load auction:', error)
                setAuctionError('Failed to load auction data')
            }
        }
        
        loadAuction()
    }, [auctionId, getAuction])
    
    
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
                    
                    // Check for auction completion message
                    if (msgData.type === 'message' && msgData.isSystemMessage && 
                        msgData.message && msgData.message.includes('🏆 Auction completed!')) {
                        console.log('🏆 Detected auction completion message, triggering completion for all participants')
                        setAuctionCompleted(true)
                        // Show success modal for all participants
                        const completionResult = {
                            winnerAddress: auction?.highestBidder,
                            finalBid: highBid,
                            nftName: auction?.title || 'NFT'
                        }
                        setAuctionResult(completionResult)
                        setShowSuccessModal(true)
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
            {/* Error States */}
            {auctionError && (
                <div className="max-w-7xl mx-auto mb-6">
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
                        <h3 className="font-bold mb-2">❌ Auction Error</h3>
                        <p>{auctionError}</p>
                    </div>
                </div>
            )}
            
            {roomError && (
                <div className="max-w-7xl mx-auto mb-6">
                    <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-4 text-yellow-200">
                        <h3 className="font-bold mb-2">⚠️ Room Connection Issue</h3>
                        <p>{roomError}</p>
                        <p className="text-sm mt-2">Auction data is still available, but real-time features may not work.</p>
                    </div>
                </div>
            )}
            
            {/* Main Dashboard Grid */}
            <div className="max-w-7xl mx-auto space-y-6">
                {/* First Row: 1/3 Auction Details + 2/3 Chat */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Auction Details Card - 1/3 width */}
                    <div className="lg:col-span-1">
                        <AuctionDetailsCard 
                            auction={auction} 
                            postBid={postBid} 
                            highBid={highBid} 
                            consumeAuction={consumeAuction} 
                            completeAuction={completeAuction}
                            onAuctionSuccess={(result) => {
                                setAuctionResult(result)
                                setShowSuccessModal(true)
                                setAuctionCompleted(true)
                            }}
                        />
                    </div>
                    
                    {/* Chat Interface - 2/3 width */}
                    <div className="lg:col-span-2">
                        <AuctionChat 
                            auction={auction} 
                            room={room}
                            messages={messages}
                            postChatMessage={postChatMessage}
                        />
                    </div>
                </div>

                {/* Second Row: 50/50 NFT and Token Balance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* NFT Balance Card - 50% width */}
                    <NFTBalanceCard auction={auction} auctionCompleted={auctionCompleted} />
                    
                    {/* Token Balance Card - 50% width */}
                    <TokenBalanceCard auction={auction} auctionCompleted={auctionCompleted} />
                </div>
            </div>

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="🏆 Auction Complete!"
                message="The battle has concluded and rewards have been distributed!"
                winnerAddress={auctionResult?.winnerAddress}
                finalBid={auctionResult?.finalBid}
                nftName={auctionResult?.nftName}
            />
        </div>
    )
}