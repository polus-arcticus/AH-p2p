import { Link } from "react-router"
import { formatUnits, maxUint256 } from 'viem'
import { useAccount } from 'wagmi'
import { useAuctionData } from '../../hooks/useAuctionData'
import { useTokenData } from '../../hooks/useTokenData'
import { useAuctionRoom } from '../../hooks/useAuctionRoom'
import { useApproveERC20 } from '../../hooks/useApproveERC20'
import { useApproveERC1155 } from '../../hooks/useApproveERC1155'
import staticData from '../../assets/Static.json'

interface AuctionHeaderProps {
    roomId: string | undefined
}

export const AuctionHeader = ({ roomId }: AuctionHeaderProps) => {
    const { auction, isAuctioneer, isAuctionEnded } = useAuctionData(roomId)
    const { tokenBalance, nftBalance, refetchBalances } = useTokenData(auction)
    const { roomPeers, currentRoom, leaveRoom } = useAuctionRoom(roomId)
    const { address } = useAccount()
    
    const erc20Approval = useApproveERC20(auction?.tokenContract as `0x${string}`, refetchBalances)
    const erc1155Approval = useApproveERC1155(auction?.nftContract as `0x${string}`, refetchBalances)
    
    const handleApproveERC20 = () => {
        if (!auction) return
        erc20Approval.approveERC20(auction.tokenContract as `0x${string}`)
    }
    
    const handleApproveERC1155 = () => {
        if (!auction) return
        erc1155Approval.approveERC1155(auction.nftContract as `0x${string}`)
    }
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
                                <div className="text-sm text-gray-400 mb-1">NFT Details (ERC1155)</div>
                                <div className="text-xs font-mono text-blue-400 mb-1">
                                    {auction.nftContract.slice(0, 10)}...{auction.nftContract.slice(-8)}
                                </div>
                                <div className="text-xs text-green-400 mb-1">Token ID: {auction.nftTokenId}</div>
                                <div className="text-xs text-gray-300 mb-2">
                                    Your Balance: {nftBalance ? nftBalance.balance.toString() : 'Loading...'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleApproveERC1155}
                                        disabled={erc1155Approval.isPending || erc1155Approval.isConfirming}
                                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-xs px-2 py-1 rounded transition-colors"
                                    >
                                        {erc1155Approval.isPending ? 'Confirming...' : 
                                         erc1155Approval.isConfirming ? 'Processing...' : 
                                         'Approve NFT'}
                                    </button>
                                    <span className={`text-xs ${erc1155Approval.isApproved ? 'text-green-400' : 'text-red-400'}`}>
                                        {erc1155Approval.isApproved === undefined ? 'Loading...' : erc1155Approval.isApproved ? '✓ Approved' : '✗ Not Approved'}
                                    </span>
                                    {erc1155Approval.hash && (
                                        <div className="text-xs text-blue-400">
                                            {erc1155Approval.isConfirming && 'Waiting for confirmation...'}
                                            {erc1155Approval.isConfirmed && '✓ Transaction confirmed'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-white/5 rounded-lg p-3">
                                <div className="text-sm text-gray-400 mb-1">Payment Token (ERC20)</div>
                                <div className="text-xs font-mono text-yellow-400 mb-1">
                                    {auction.tokenContract.slice(0, 10)}...{auction.tokenContract.slice(-8)}
                                </div>
                                <div className="text-xs text-green-400 mb-1">Token: {tokenBalance?.symbol}</div>
                                <div className="text-xs text-gray-300 mb-2">
                                    Your Balance: {tokenBalance ? `${parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals)).toFixed(4)} ${tokenBalance.symbol}` : 'Loading...'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleApproveERC20}
                                        disabled={erc20Approval.isPending || erc20Approval.isConfirming}
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white text-xs px-2 py-1 rounded transition-colors"
                                    >
                                        {erc20Approval.isPending ? 'Confirming...' : 
                                         erc20Approval.isConfirming ? 'Processing...' : 
                                         'Approve Token'}
                                    </button>
                                    <span className={`text-xs ${erc20Approval.allowance && erc20Approval.allowance > 0n ? 'text-green-400' : 'text-red-400'}`}>
                                        {erc20Approval.allowance === undefined ? 'Loading...' : 
                                         erc20Approval.allowance === 0n ? '✗ No Allowance' :
                                         erc20Approval.allowance === maxUint256 ? '✓ Max Approved' :
                                         `✓ ${parseFloat(formatUnits(erc20Approval.allowance, tokenBalance?.decimals || 18)).toFixed(2)} ${tokenBalance?.symbol || 'Approved'}`}
                                    </span>
                                    {erc20Approval.hash && (
                                        <div className="text-xs text-blue-400">
                                            {erc20Approval.isConfirming && 'Waiting for confirmation...'}
                                            {erc20Approval.isConfirmed && '✓ Transaction confirmed'}
                                        </div>
                                    )}
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