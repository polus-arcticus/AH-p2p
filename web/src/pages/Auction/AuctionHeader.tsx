import { Link } from "react-router"
import { formatUnits } from 'viem'
import { useAuctionData } from '../../hooks/useAuctionData'
import { useTokenData } from '../../hooks/useTokenData'
import { useAuctionRoom } from '../../hooks/useAuctionRoom'

interface AuctionHeaderProps {
    roomId: string | undefined
}

export const AuctionHeader = ({ roomId }: AuctionHeaderProps) => {
    const { auction, isAuctioneer, isAuctionEnded } = useAuctionData(roomId)
    const { tokenBalance, nftBalance } = useTokenData(auction)
    const { roomPeers, currentRoom, leaveRoom } = useAuctionRoom(roomId)
    return (
        <div className="bg-black/30 p-6 border-b border-white/10">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                        <h2 className="text-2xl font-bold text-white">
                            {auction?.title || `Auction Room: ${roomId}`}
                        </h2>
                        {isAuctioneer && (
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-semibold animate-pulse">
                                👑 AUCTIONEER
                            </span>
                        )}
                        {isAuctionEnded && (
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                ENDED
                            </span>
                        )}
                        {!isAuctioneer && !isAuctionEnded && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                BIDDER
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
                                <div className="text-xs text-green-400 mb-1">Token ID: {auction.nftTokenId}</div>
                                <div className="text-xs text-gray-300">
                                    Your Balance: {nftBalance ? nftBalance.balance.toString() : 'Loading...'}
                                </div>
                            </div>
                            
                            <div className="bg-white/5 rounded-lg p-3">
                                <div className="text-sm text-gray-400 mb-1">Payment Token</div>
                                <div className="text-xs font-mono text-yellow-400 mb-1">
                                    {auction.tokenContract.slice(0, 10)}...{auction.tokenContract.slice(-8)}
                                </div>
                                <div className="text-xs text-green-400 mb-1">Token: {tokenBalance?.symbol}</div>
                                <div className="text-xs text-gray-300">
                                    Your Balance: {tokenBalance ? `${parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals)).toFixed(4)} ${tokenBalance.symbol}` : 'Loading...'}
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
    )
} 