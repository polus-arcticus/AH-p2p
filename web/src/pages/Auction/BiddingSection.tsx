import { useState } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits, parseEther } from 'viem'
import { useAuctionData } from '../../hooks/useAuctionData'
import { useTokenData } from '../../hooks/useTokenData'
import { useAuctionRoom } from '../../hooks/useAuctionRoom'
import { useAuctionSignature, type BidMessage } from '../../hooks/useAuctionSignature'
import { useAuctionNonce } from '../../hooks/useAuctionNonce'

interface BiddingSectionProps {
    roomId: string | undefined
}

export const BiddingSection = ({ roomId }: BiddingSectionProps) => {
    const { address, isConnected } = useAccount()
    const { auction, isAuctioneer, isAuctionEnded } = useAuctionData(roomId)
    const { tokenBalance } = useTokenData(auction)
    const { roomPeers, currentRoom, chatMessages, sendChatMessage } = useAuctionRoom(roomId)
    const { signBid, isPending: signingBid, error: signError } = useAuctionSignature()
    const { nonce, isLoading: nonceLoading } = useAuctionNonce(address)
    const [bidAmount, setBidAmount] = useState('')

    const handlePlaceBid = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!isConnected || !address) {
            alert('Please connect your wallet first')
            return
        }

        if (!auction?.sigHash) {
            alert('Auction signature hash not available')
            return
        }

        if (!bidAmount.trim() || !currentRoom) {
            return
        }

        try {
            // Create the bid message following the test pattern
            const bidMessage: BidMessage = {
                bidder: address,
                amount: parseEther(bidAmount).toString(),
                bidderNonce: nonce,
                auctionSigHash: auction.sigHash // Assuming auction stores the sigHash
            }

            // Sign the bid with EIP-712
            const bidSignature = await signBid(bidMessage)

            // Send the signed bid data via pubsub for auctioneer to collect
            const signedBidData = {
                bid: bidMessage,
                signature: bidSignature,
                timestamp: Date.now()
            }

            // Send both the display message and signed bid data
            const displayMessage = `BID:${bidAmount}`
            const fullMessage = `${displayMessage}:SIGNED:${JSON.stringify(signedBidData)}`
            
            sendChatMessage(fullMessage, currentRoom)
            setBidAmount('')
        } catch (error) {
            console.error('Failed to sign bid:', error)
            alert('Failed to sign bid. Please try again.')
        }
    }

    return (
        <div className="lg:col-span-1">
            <div className={`bg-white/5 rounded-lg p-4 border ${isAuctioneer ? 'border-purple-500/30' : 'border-white/10'}`}>
                <div className="flex items-center space-x-2 mb-4">
                    <h3 className="text-lg font-semibold text-white">Place Bid</h3>
                    {isAuctioneer ? (
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                            AUCTIONEER VIEW
                        </span>
                    ) : (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            BIDDER
                        </span>
                    )}
                </div>
                
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
                                Available: {tokenBalance ? `${parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals)).toFixed(4)} ${tokenBalance.symbol}` : 'Loading...'}
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
                        {signError && (
                            <div className="text-red-400 text-sm">
                                Error: {signError.message}
                            </div>
                        )}
                        {!isConnected && (
                            <div className="text-yellow-400 text-sm">
                                Connect your wallet to place bids
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={!bidAmount || parseFloat(bidAmount) < parseFloat(auction?.startingBid || '0') || signingBid || nonceLoading || !isConnected}
                            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200"
                        >
                            {nonceLoading ? 'Loading...' : signingBid ? 'Signing Bid...' : '🔨 Place Bid'}
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
                                                .map(msg => {
                                                    // Parse both signed and legacy bid formats
                                                    const parts = msg.message.split(':')
                                                    if (parts.length >= 2 && parts[2] === 'SIGNED') {
                                                        return parseFloat(parts[1]) || 0
                                                    } else {
                                                        return parseFloat(msg.message.slice(4)) || 0
                                                    }
                                                })
                                            return bids.length > 0 ? `${Math.max(...bids)} ${tokenBalance?.symbol || 'ERC20'}` : 'No bids yet'
                                        })()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
} 