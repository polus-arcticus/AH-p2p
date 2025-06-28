import { useState } from 'react'
import staticContracts from '../assets/Static.json'

// Mock contract addresses from deployment
const MOCK_CONTRACTS = {
    exampleNftAddr: (staticContracts as any).exampleNftAddr || "0x8825bdb4fc43139b1eaa29641b59fdca25e9da50",
    exampleTokenAddr: (staticContracts as any).exampleTokenAddr || "0xa75c03c87398f485b22c52f5e1aa4bb4802824e7"
}

interface CreateAuctionModalProps {
    showCreateForm: boolean
    setShowCreateForm: (show: boolean) => void
    createAuction: (auction: {
        title: string
        description: string
        nftContract: string
        nftTokenId: string
        tokenContract: string
        startingBid: string
        endTime: number
    }) => string | undefined
}

export const CreateAuctionModal = ({ 
    showCreateForm, 
    setShowCreateForm, 
    createAuction 
}: CreateAuctionModalProps) => {
    // Calculate default end time (1 hour from now)
    const getDefaultEndTime = () => {
        const now = new Date()
        now.setHours(now.getHours() + 1) // Add 1 hour (3600 seconds)
        return now.toISOString().slice(0, 16) // Format for datetime-local input
    }

    const [auctionForm, setAuctionForm] = useState({
        title: 'Test Auction',
        description: 'Testing ERC1155 to ERC20 auction',
        nftContract: MOCK_CONTRACTS.exampleNftAddr,
        nftTokenId: '0',
        tokenContract: MOCK_CONTRACTS.exampleTokenAddr,
        startingBid: '0.01',
        endTime: getDefaultEndTime()
    })

    const handleCreateAuction = (e: React.FormEvent) => {
        e.preventDefault()
        
        const endTime = new Date(auctionForm.endTime).getTime()
        if (endTime <= Date.now()) {
            alert('End time must be in the future')
            return
        }

        const auctionId = createAuction({
            title: auctionForm.title,
            description: auctionForm.description,
            nftContract: auctionForm.nftContract,
            nftTokenId: auctionForm.nftTokenId,
            tokenContract: auctionForm.tokenContract,
            startingBid: auctionForm.startingBid,
            endTime
        })

        if (auctionId) {
            setShowCreateForm(false)
            setAuctionForm({
                title: 'Test Auction',
                description: 'Testing ERC1155 to ERC20 auction',
                nftContract: MOCK_CONTRACTS.exampleNftAddr,
                nftTokenId: '0',
                tokenContract: MOCK_CONTRACTS.exampleTokenAddr,
                startingBid: '0.01',
                endTime: getDefaultEndTime()
            })
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
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all duration-200"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
} 