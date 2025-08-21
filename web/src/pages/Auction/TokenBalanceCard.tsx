import { useTokenData } from "@/hooks/useTokenData"
import { useApproveERC20 } from "@/hooks/useApproveERC20"
import { formatUnits } from "viem"

interface TokenBalanceCardProps {
    auction: any
}

export const TokenBalanceCard = ({ auction }: TokenBalanceCardProps) => {
    const { tokenBalance, refetchBalances } = useTokenData(auction)
    const { 
        approveERC20, 
        allowance, 
        isPending, 
        isConfirming,
        refetchAllowance 
    } = useApproveERC20(auction?.tokenContract, () => {
        refetchBalances()
        refetchAllowance()
    })

    const handleApprove = () => {
        if (auction?.tokenContract) {
            approveERC20(auction.tokenContract)
        }
    }

    const getApprovalStatus = () => {
        if (isPending || isConfirming) return "pending"
        if (allowance && allowance > 0n) return "approved"
        return "not_approved"
    }

    const approvalStatus = getApprovalStatus()

    const formatBalance = (balance: bigint, decimals: number) => {
        const formatted = formatUnits(balance, decimals)
        const num = parseFloat(formatted)
        if (num < 0.001 && num > 0) return "< 0.001"
        return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
    }

    const formatAllowance = (allowance: bigint, decimals: number) => {
        const formatted = formatUnits(allowance, decimals)
        const num = parseFloat(formatted)
        if (num > 1000000) return "∞"
        return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">💰</div>
                <div>
                    <h3 className="text-xl font-bold text-green-400">Token Vault</h3>
                    <p className="text-sm text-slate-400">ERC20 Balance & Approvals</p>
                </div>
            </div>

            {/* Token Balance */}
            <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 font-medium">Balance</span>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">
                                {tokenBalance ? formatBalance(tokenBalance.value, tokenBalance.decimals) : "0"}
                            </div>
                            <div className="text-sm text-slate-400">
                                {tokenBalance?.symbol || "TOKEN"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contract Info */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-sm text-slate-300 mb-2">Token Contract</div>
                    <div className="font-mono text-xs text-green-400 break-all">
                        {auction?.tokenContract || "Not connected"}
                    </div>
                </div>

                {/* Allowance Info */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 font-medium">Allowance</span>
                        <div className="text-right">
                            <div className="text-lg font-bold text-orange-400">
                                {allowance && tokenBalance ? 
                                    formatAllowance(allowance, tokenBalance.decimals) : "0"
                                }
                            </div>
                            <div className="text-sm text-slate-400">
                                {tokenBalance?.symbol || "TOKEN"}
                            </div>
                        </div>
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
                            disabled={!auction?.tokenContract}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                        >
                            💎 Approve Tokens for Bidding
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
                            ⚔️ Locked and loaded! Your tokens are approved for bidding.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
