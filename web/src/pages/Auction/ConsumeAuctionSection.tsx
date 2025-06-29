import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import { useAuctionData } from '../../hooks/useAuctionData'
import { useAuctionRoom } from '../../hooks/useAuctionRoom'
import { useSignedBids } from '../../hooks/useSignedBids'
import { useAuctionSignature, type AuctionMessage } from '../../hooks/useAuctionSignature'
import { useAuctionNonce } from '../../hooks/useAuctionNonce'
import staticContracts from '../../assets/Static.json'

const ENGLISH_AUCTION_ADDRESS = (staticContracts as any).englishAuctionAddr as `0x${string}`
const ENGLISH_AUCTION_ABI = (staticContracts as any).englishAuctionAbi

interface ConsumeAuctionSectionProps {
    roomId: string | undefined
}

export const ConsumeAuctionSection = ({ roomId }: ConsumeAuctionSectionProps) => {
    const { address, isConnected } = useAccount()
    const { auction, isAuctioneer } = useAuctionData(roomId)
    const { chatMessages, currentRoom } = useAuctionRoom(roomId)
    const { bids, bidSigs, bidCount } = useSignedBids(chatMessages, currentRoom)
    const { signAuction, isPending: signingAuction, error: signError } = useAuctionSignature()
    const { nonce, isLoading: nonceLoading } = useAuctionNonce(address)
    const { writeContract, isPending: contractPending, error: contractError } = useWriteContract()
    const [isProcessing, setIsProcessing] = useState(false)

    const handleConsumeAuction = async () => {
        if (!isConnected || !address || !auction) {
            alert('Missing requirements for auction consumption')
            return
        }

        if (!auction.sigHash) {
            alert('Auction signature hash not available')
            return
        }

        if (bids.length === 0) {
            alert('No bids to process')
            return
        }

        setIsProcessing(true)
        try {
            // Create the complete auction message following the test pattern
            const auctionMessage: AuctionMessage = {
                auctioneer: address,
                auctioneerNonce: nonce,
                nft: auction.nftContract,
                nftId: auction.nftTokenId,
                token: auction.tokenContract,
                bidStart: parseEther(auction.startingBid).toString(),
                deadline: Math.floor(auction.endTime / 1000),
                auctionSigHash: auction.sigHash,
                bids,
                bidSigs
            }

            // Sign the complete auction
            const auctionSignature = await signAuction(auctionMessage)

            // Extract v, r, s from signature (following test pattern)
            const auctionSigNo0x = auctionSignature.substring(2)
            const r = '0x' + auctionSigNo0x.substring(0, 64) as `0x${string}`
            const s = '0x' + auctionSigNo0x.substring(64, 128) as `0x${string}`
            const v = parseInt(auctionSigNo0x.substring(128, 130), 16)

            console.log('Calling consumeAuction with:', {
                v, r, s,
                auction: auctionMessage,
                bidCount: bids.length
            })

            // Call the contract
            writeContract({
                address: ENGLISH_AUCTION_ADDRESS,
                abi: ENGLISH_AUCTION_ABI,
                functionName: 'consumeAuction',
                args: [v, r, s, auctionMessage]
            })

        } catch (error) {
            console.error('Failed to consume auction:', error)
            alert('Failed to consume auction. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    // Only show to auctioneer
    if (!isAuctioneer) {
        return null
    }

    return (
        <div className="bg-white/5 rounded-lg p-4 border border-purple-500/30 mb-4">
            <div className="flex items-center space-x-2 mb-3">
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    AUCTIONEER
                </span>
                <h3 className="text-lg font-semibold text-white">Consume Auction</h3>
            </div>
            
            <div className="space-y-3">
                <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-sm text-gray-400 mb-2">Collected Bids</div>
                    <div className="text-xl font-bold text-green-400">{bidCount} signed bids</div>
                    {bidCount > 0 && (
                        <div className="text-xs text-gray-300 mt-1">
                            Highest: {bids[0] ? `${parseFloat(bids[0].amount) / 1e18} ETH` : 'N/A'}
                        </div>
                    )}
                </div>

                {(signError || contractError) && (
                    <div className="text-red-400 text-sm">
                        Error: {signError?.message || contractError?.message}
                    </div>
                )}

                {!isConnected && (
                    <div className="text-yellow-400 text-sm">
                        Connect your wallet to consume auction
                    </div>
                )}

                <button
                    onClick={handleConsumeAuction}
                    disabled={!isConnected || bidCount === 0 || signingAuction || contractPending || nonceLoading || isProcessing}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200"
                >
                    {nonceLoading ? 'Loading...' : 
                     signingAuction ? 'Signing Auction...' : 
                     contractPending ? 'Executing Contract...' :
                     isProcessing ? 'Processing...' : 
                     `⚡ Consume Auction (${bidCount} bids)`}
                </button>

                <div className="text-xs text-gray-400">
                    This will sign the complete auction with all collected bids and prepare it for contract execution.
                </div>
            </div>
        </div>
    )
} 