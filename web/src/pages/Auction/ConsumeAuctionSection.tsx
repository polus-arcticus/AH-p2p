import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
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
    const { nonce, isLoading: nonceLoading } = useAuctionNonce()
    const { writeContract, isPending: contractPending, error: contractError, data: hash } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })
    const [isProcessing, setIsProcessing] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    // Show success modal when transaction is confirmed
    useEffect(() => {
        if (isConfirmed) {
            setShowSuccessModal(true)
            setIsProcessing(false)
        }
    }, [isConfirmed])

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
                auctioneerNonce: nonce && typeof nonce !== 'undefined' ? BigInt(nonce.toString()) : BigInt(0),
                nft: auction.nftContract,
                nftId: BigInt(auction.nftTokenId),
                token: auction.tokenContract,
                bidStart: parseEther(auction.startingBid),
                deadline: Math.floor(auction.endTime / 1000),
                auctionSigHash: auction.sigHash,
                bids: bids.map(bid => ({
                    bidder: bid.bidder,
                    amount: BigInt(bid.amount),
                    bidderNonce: BigInt(bid.bidderNonce),
                    auctionSigHash: bid.auctionSigHash
                })),
                bidSigs
            }

            // Sign the complete auction
            const auctionSignature = await signAuction(auctionMessage)

            // Extract v, r, s from signature (following test pattern)
            const auctionSigNo0x = auctionSignature.substring(2)
            const r = '0x' + auctionSigNo0x.substring(0, 64) as `0x${string}`
            const s = '0x' + auctionSigNo0x.substring(64, 128) as `0x${string}`
            const v = parseInt(auctionSigNo0x.substring(128, 130), 16)

            // Convert the auction message for contract call (convert string fields to proper types)
            const contractAuctionMessage = {
                ...auctionMessage,
                auctioneerNonce: BigInt(auctionMessage.auctioneerNonce),
                nftId: BigInt(auctionMessage.nftId),
                bidStart: BigInt(auctionMessage.bidStart),
                bids: auctionMessage.bids.map(bid => ({
                    ...bid,
                    bidderNonce: BigInt(bid.bidderNonce),
                    amount: BigInt(bid.amount)
                }))
            }

            console.log('Debug: Contract message after type conversion:', contractAuctionMessage)
            console.log('Calling consumeAuction with:', {
                v, r, s,
                auction: contractAuctionMessage,
                bidCount: bids.length
            })

            // Call the contract
            writeContract({
                address: ENGLISH_AUCTION_ADDRESS,
                abi: ENGLISH_AUCTION_ABI,
                functionName: 'consumeAuction',
                args: [v, r, s, contractAuctionMessage]
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
                    disabled={!isConnected || bidCount === 0 || signingAuction || contractPending || isConfirming || nonceLoading || isProcessing}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200"
                >
                    {nonceLoading ? 'Loading...' : 
                     signingAuction ? 'Signing Auction...' : 
                     contractPending ? 'Executing Contract...' :
                     isConfirming ? 'Confirming Transaction...' :
                     isProcessing ? 'Processing...' : 
                     `⚡ Consume Auction (${bidCount} bids)`}
                </button>

                {hash && (
                    <div className="text-xs text-blue-400 mt-2">
                        {isConfirming && '⏳ Waiting for transaction confirmation...'}
                        {isConfirmed && '✅ Transaction confirmed!'}
                    </div>
                )}

                <div className="text-xs text-gray-400">
                    This will sign the complete auction with all collected bids and prepare it for contract execution.
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Auction Completed!</h2>
                        <p className="text-gray-600 mb-4">
                            The auction has been successfully consumed and the NFT has been transferred to the winning bidder.
                        </p>
                        
                        {bidCount > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="text-sm text-blue-800">
                                    <div className="font-semibold">Auction Results:</div>
                                    <div className="mt-1">
                                        📦 {bidCount} bid{bidCount !== 1 ? 's' : ''} processed
                                    </div>
                                    {bids[0] && (
                                        <div className="mt-1">
                                            🏆 Winning bid: {parseFloat(bids[0].amount) / 1e18} ETH
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="text-sm text-green-800">
                                <div className="font-semibold">Transaction Hash:</div>
                                <div className="font-mono text-xs break-all mt-1">{hash}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold transition-all duration-200"
                            >
                                🎊 Celebrate Success!
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false)
                                    window.location.href = '/auctions'
                                }}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition-all duration-200"
                            >
                                Return to Auctions
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 