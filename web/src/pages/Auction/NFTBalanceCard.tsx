import { useTokenData } from "@/hooks/useTokenData"
import { useApproveERC1155 } from "@/hooks/useApproveERC1155"

interface NFTBalanceCardProps {
    auction: any
}

export const NFTBalanceCard = ({ auction }: NFTBalanceCardProps) => {
    const { nftBalance, refetchBalances } = useTokenData(auction)
    const { 
        approveERC1155, 
        isApproved, 
        isPending, 
        isConfirming,
        refetchApproval 
    } = useApproveERC1155(auction?.nftContract, () => {
        refetchBalances()
        refetchApproval()
    })

    const handleApprove = () => {
        if (auction?.nftContract) {
            approveERC1155(auction.nftContract)
        }
    }

    const getApprovalStatus = () => {
        if (isPending || isConfirming) return "pending"
        if (isApproved) return "approved"
        return "not_approved"
    }

    const approvalStatus = getApprovalStatus()

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">🖼️</div>
                <div>
                    <h3 className="text-xl font-bold text-cyan-400">NFT Arsenal</h3>
                    <p className="text-sm text-slate-400">ERC1155 Balance & Approvals</p>
                </div>
            </div>

            {/* NFT Balance */}
            <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 font-medium">Token Balance</span>
                        <span className="text-2xl font-bold text-green-400">
                            {nftBalance ? nftBalance.balance.toString() : "0"}
                        </span>
                    </div>
                    <div className="text-xs text-slate-400">
                        Token ID: {auction?.nftTokenId || "N/A"}
                    </div>
                </div>

                {/* Contract Info */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-300 mb-2">NFT Contract</div>
                    <div className="font-mono text-xs text-cyan-400 break-all">
                        {auction?.nftContract || "Not connected"}
                    </div>
                </div>

                {/* Approval Status */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-300 font-medium">Auction Approval</span>
                        <div className="flex items-center gap-2">
                            {approvalStatus === "approved" && (
                                <>
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-400 text-sm font-semibold">✅ Approved</span>
                                </>
                            )}
                            {approvalStatus === "not_approved" && (
                                <>
                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                    <span className="text-red-400 text-sm font-semibold">❌ Not Approved</span>
                                </>
                            )}
                            {approvalStatus === "pending" && (
                                <>
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                    <span className="text-yellow-400 text-sm font-semibold">⏳ Pending</span>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {approvalStatus === "not_approved" && (
                        <button
                            onClick={handleApprove}
                            disabled={!auction?.nftContract}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                        >
                            🛡️ Approve NFT for Auction
                        </button>
                    )}
                    
                    {approvalStatus === "pending" && (
                        <div className="w-full bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-lg text-center">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                                {isPending ? "Confirming Transaction..." : "Processing Approval..."}
                            </div>
                        </div>
                    )}
                    
                    {approvalStatus === "approved" && (
                        <div className="text-center text-green-400 text-sm">
                            ⚔️ Ready for battle! Your NFT is approved for auction.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
