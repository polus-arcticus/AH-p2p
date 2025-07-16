import { useState, useContext } from 'react'
import { parseEther } from 'viem'
import { useAccount } from 'wagmi'
import { useAuctionSignature, type AuctionAuthSigMessage } from '../hooks/useAuctionSignature'
import { useAuctionNonce } from '../hooks/useAuctionNonce'
import { HeliaContext } from '../providers/HeliaProvider'
import staticContracts from '../assets/Static.json'

interface CreateAuctionModalProps {
    showCreateForm: boolean
    setShowCreateForm: (show: boolean) => void
}

export const CreateAuctionModal = ({ 
    showCreateForm, 
    setShowCreateForm
}: CreateAuctionModalProps) => {
    const { address, isConnected } = useAccount()
    const { signAuctionAuth, isPending, error } = useAuctionSignature()
    const { nonce, isLoading: nonceLoading } = useAuctionNonce(address)
    const { AHP2P } = useContext(HeliaContext)
    
    // Calculate default end time (1 hour from now)
    const getDefaultEndTime = () => {
        const now = new Date()
        now.setHours(now.getHours() + 1) // Add 1 hour (3600 seconds)
        return now.toISOString().slice(0, 16) // Format for datetime-local input
    }

    const [auctionForm, setAuctionForm] = useState({
        title: 'Test Auction',
        description: 'Testing ERC1155 to ERC20 auction',
        nftContract: staticContracts.exampleNftAddr,
        nftTokenId: '0',
        tokenContract: staticContracts.exampleTokenAddr,
        startingBid: '0.01',
        endTime: getDefaultEndTime()
    })

    const handleCreateAuction = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!isConnected || !address) {
            alert('Please connect your wallet first')
            return
        }

        if (!AHP2P?.pubsubService) {
            alert('P2P network not ready. Please wait and try again.')
            return
        }

        const endTime = new Date(auctionForm.endTime).getTime()
        if (endTime <= Date.now()) {
            alert('End time must be in the future')
            return
        }

        try {
            // Use actual nonce from contract
            const message: AuctionAuthSigMessage = {
                auctioneer: address,
                auctioneerNonce: nonce,
                nft: auctionForm.nftContract,
                nftId: auctionForm.nftTokenId,
                token: auctionForm.tokenContract,
                bidStart: parseEther(auctionForm.startingBid).toString(),
                deadline: Math.floor(endTime / 1000) // Convert to seconds
            }

            const { signature, sigHash } = await signAuctionAuth(message)

            const auctionId = await AHP2P.pubsubService.createAuction({
                title: auctionForm.title,
                description: auctionForm.description,
                nftContract: auctionForm.nftContract,
                nftTokenId: auctionForm.nftTokenId,
                tokenContract: auctionForm.tokenContract,
                startingBid: auctionForm.startingBid,
                endTime,
                signature,
                sigHash
            }, address)

            if (auctionId) {
                setShowCreateForm(false)
                setAuctionForm({
                    title: 'Test Auction',
                    description: 'Testing ERC1155 to ERC20 auction',
                    nftContract: staticContracts.exampleNftAddr,
                    nftTokenId: '0',
                    tokenContract: staticContracts.exampleTokenAddr,
                    startingBid: '0.01',
                    endTime: getDefaultEndTime()
                })
                alert(`Auction created successfully! ID: ${auctionId}`)
            }
        } catch (error) {
            console.error('Failed to create auction:', error)
            alert('Failed to create auction. Please try again.')
        }
    }

    if (!showCreateForm) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Create New Auction</h3>
                <form onSubmit={handleCreateAuction} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Auction title"
                        value={auctionForm.title}
                        onChange={(e) => setAuctionForm({...auctionForm, title: e.target.value})}
                        className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                        required
                    />
                    <textarea
                        placeholder="Description"
                        value={auctionForm.description}
                        onChange={(e) => setAuctionForm({...auctionForm, description: e.target.value})}
                        className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none h-24 resize-none"
                        required
                    />
                    <input
                        type="text"
                        placeholder="ERC1155 NFT Contract Address"
                        value={auctionForm.nftContract}
                        onChange={(e) => setAuctionForm({...auctionForm, nftContract: e.target.value})}
                        className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                        required
                    />
                    <input
                        type="text"
                        placeholder="NFT Token ID"
                        value={auctionForm.nftTokenId}
                        onChange={(e) => setAuctionForm({...auctionForm, nftTokenId: e.target.value})}
                        className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                        required
                    />
                    <input
                        type="text"
                        placeholder="ERC20 Token Contract Address (for payment)"
                        value={auctionForm.tokenContract}
                        onChange={(e) => setAuctionForm({...auctionForm, tokenContract: e.target.value})}
                        className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                        required
                    />
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Starting bid (ERC20 tokens)"
                        value={auctionForm.startingBid}
                        onChange={(e) => setAuctionForm({...auctionForm, startingBid: e.target.value})}
                        className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                        required
                    />
                    <input
                        type="datetime-local"
                        value={auctionForm.endTime}
                        onChange={(e) => setAuctionForm({...auctionForm, endTime: e.target.value})}
                        className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                        required
                    />
                    {error && (
                        <div className="text-red-400 text-sm">
                            Error: {error.message}
                        </div>
                    )}
                    {!isConnected && (
                        <div className="text-yellow-400 text-sm">
                            Please connect your wallet to create an auction
                        </div>
                    )}
                    {!AHP2P?.pubsubService && (
                        <div className="text-yellow-400 text-sm">
                            P2P network not ready. Please wait...
                        </div>
                    )}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(false)}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !isConnected || nonceLoading || !AHP2P?.pubsubService}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200"
                        >
                            {nonceLoading ? 'Loading...' : isPending ? 'Signing...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
} 