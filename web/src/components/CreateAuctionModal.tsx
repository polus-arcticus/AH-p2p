import React from 'react'
import { useForm } from 'react-hook-form'
import staticContracts from '../assets/Static.json'

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
        signature?: string
        sigHash?: string
    }) => Promise<any>
}

interface AuctionFormData {
    title: string
    description: string
    nftContract: string
    nftTokenId: string
    tokenContract: string
    startingBid: string
    durationHours: number
}

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({
    showCreateForm,
    setShowCreateForm,
    createAuction
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<AuctionFormData>({
        defaultValues: {
            title: 'Test Auction',
            description: 'Testing ERC1155 to ERC20 auction',
            nftContract: staticContracts.exampleNftAddr,
            nftTokenId: '0',
            tokenContract: staticContracts.exampleTokenAddr,
            startingBid: '0.01',
            durationHours: 24
        }
    })

    const onSubmit = async (data: AuctionFormData) => {
        console.log('submitting')
        try {
            // Calculate end time based on duration in hours
            const endTime = Date.now() + (data.durationHours * 60 * 60 * 1000)
            
            const auctionData = {
                title: data.title,
                description: data.description,
                nftContract: data.nftContract,
                nftTokenId: data.nftTokenId,
                tokenContract: data.tokenContract,
                startingBid: data.startingBid,
                endTime
            }

            const result = await createAuction(auctionData)
            
            if (result) {
                console.log('Auction created successfully:', result)
                reset()
                setShowCreateForm(false)
            }
        } catch (error) {
            console.error('Error creating auction:', error)
        }
    }

    const handleClose = () => {
        reset()
        setShowCreateForm(false)
    }

    if (!showCreateForm) {
        return null
    }

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleClose}
        >
            <div 
                className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl glow-green"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Epic Gaming Header */}
                <div className="bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-orange-500/20 border-b border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">🎯</div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent">
                                Create Epic Auction
                            </h2>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <button 
                            type="button" 
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 text-xl font-bold"
                            onClick={handleClose}
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-slate-300 mt-2 text-sm">
                        🚀 Launch your NFT into the P2P auction arena and let the bidding wars begin!
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Title Field */}
                    <div className="space-y-2">
                        <label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-green-400">
                            🎯 <span>Auction Title *</span>
                        </label>
                        <input
                            id="title"
                            type="text"
                            placeholder="Enter an epic auction title..."
                            {...register('title', {
                                required: 'Title is required',
                                minLength: {
                                    value: 3,
                                    message: 'Title must be at least 3 characters'
                                }
                            })}
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 ${
                                errors.title 
                                    ? 'border-red-500 focus:ring-red-500/50 glow-orange' 
                                    : 'border-slate-600 focus:border-green-400 focus:ring-green-400/50 hover:border-slate-500'
                            }`}
                        />
                        {errors.title && (
                            <span className="flex items-center gap-1 text-red-400 text-xs">
                                ⚠️ {errors.title.message}
                            </span>
                        )}
                    </div>

                    {/* Description Field */}
                    <div className="space-y-2">
                        <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
                            📝 <span>Description *</span>
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            placeholder="Describe your NFT and what makes this auction special..."
                            {...register('description', {
                                required: 'Description is required',
                                minLength: {
                                    value: 10,
                                    message: 'Description must be at least 10 characters'
                                }
                            })}
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 resize-vertical ${
                                errors.description 
                                    ? 'border-red-500 focus:ring-red-500/50 glow-orange' 
                                    : 'border-slate-600 focus:border-cyan-400 focus:ring-cyan-400/50 hover:border-slate-500'
                            }`}
                        />
                        {errors.description && (
                            <span className="flex items-center gap-1 text-red-400 text-xs">
                                ⚠️ {errors.description.message}
                            </span>
                        )}
                    </div>

                    {/* NFT Contract Field */}
                    <div className="space-y-2">
                        <label htmlFor="nftContract" className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                            🖼️ <span>NFT Contract Address *</span>
                        </label>
                        <input
                            id="nftContract"
                            type="text"
                            placeholder="0x... (Your NFT contract address)"
                            {...register('nftContract', {
                                required: 'NFT contract address is required',
                                pattern: {
                                    value: /^0x[a-fA-F0-9]{40}$/,
                                    message: 'Invalid Ethereum address format'
                                }
                            })}
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 font-mono text-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
                                errors.nftContract 
                                    ? 'border-red-500 focus:ring-red-500/50 glow-orange' 
                                    : 'border-slate-600 focus:border-purple-400 focus:ring-purple-400/50 hover:border-slate-500'
                            }`}
                        />
                        {errors.nftContract && (
                            <span className="flex items-center gap-1 text-red-400 text-xs">
                                ⚠️ {errors.nftContract.message}
                            </span>
                        )}
                    </div>

                    {/* NFT Token ID Field */}
                    <div className="space-y-2">
                        <label htmlFor="nftTokenId" className="flex items-center gap-2 text-sm font-semibold text-orange-400">
                            🆔 <span>NFT Token ID *</span>
                        </label>
                        <input
                            id="nftTokenId"
                            type="text"
                            placeholder="0, 1, 2, 3... (Token ID number)"
                            {...register('nftTokenId', {
                                required: 'NFT token ID is required',
                                pattern: {
                                    value: /^\d+$/,
                                    message: 'Token ID must be a number'
                                }
                            })}
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 font-mono transition-all duration-300 focus:outline-none focus:ring-2 ${
                                errors.nftTokenId 
                                    ? 'border-red-500 focus:ring-red-500/50 glow-orange' 
                                    : 'border-slate-600 focus:border-orange-400 focus:ring-orange-400/50 hover:border-slate-500'
                            }`}
                        />
                        {errors.nftTokenId && (
                            <span className="flex items-center gap-1 text-red-400 text-xs">
                                ⚠️ {errors.nftTokenId.message}
                            </span>
                        )}
                    </div>

                    {/* Token Contract Field */}
                    <div className="space-y-2">
                        <label htmlFor="tokenContract" className="flex items-center gap-2 text-sm font-semibold text-yellow-400">
                            🪙 <span>Payment Token Contract *</span>
                        </label>
                        <input
                            id="tokenContract"
                            type="text"
                            placeholder="0x... (ERC-20 token for bidding)"
                            {...register('tokenContract', {
                                required: 'Token contract address is required',
                                pattern: {
                                    value: /^0x[a-fA-F0-9]{40}$/,
                                    message: 'Invalid Ethereum address format'
                                }
                            })}
                            className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 font-mono text-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
                                errors.tokenContract 
                                    ? 'border-red-500 focus:ring-red-500/50 glow-orange' 
                                    : 'border-slate-600 focus:border-yellow-400 focus:ring-yellow-400/50 hover:border-slate-500'
                            }`}
                        />
                        {errors.tokenContract && (
                            <span className="flex items-center gap-1 text-red-400 text-xs">
                                ⚠️ {errors.tokenContract.message}
                            </span>
                        )}
                    </div>

                    {/* Starting Bid Field */}
                    <div className="space-y-2">
                        <label htmlFor="startingBid" className="flex items-center gap-2 text-sm font-semibold text-green-400">
                            💰 <span>Starting Bid *</span>
                        </label>
                        <div className="relative">
                            <input
                                id="startingBid"
                                type="text"
                                placeholder="0.1 (Minimum bid amount)"
                                {...register('startingBid', {
                                    required: 'Starting bid is required',
                                    pattern: {
                                        value: /^\d*\.?\d+$/,
                                        message: 'Starting bid must be a valid number'
                                    },
                                    validate: (value) => {
                                        const num = parseFloat(value)
                                        return num > 0 || 'Starting bid must be greater than 0'
                                    }
                                })}
                                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 ${
                                    errors.startingBid 
                                        ? 'border-red-500 focus:ring-red-500/50 glow-orange' 
                                        : 'border-slate-600 focus:border-green-400 focus:ring-green-400/50 hover:border-slate-500'
                                }`}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                                🪙
                            </div>
                        </div>
                        {errors.startingBid && (
                            <span className="flex items-center gap-1 text-red-400 text-xs">
                                ⚠️ {errors.startingBid.message}
                            </span>
                        )}
                    </div>

                    {/* Duration Field */}
                    <div className="space-y-2">
                        <label htmlFor="durationHours" className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                            ⏰ <span>Auction Duration (hours) *</span>
                        </label>
                        <div className="relative">
                            <input
                                id="durationHours"
                                type="number"
                                min="1"
                                max="168"
                                placeholder="24 (1-168 hours)"
                                {...register('durationHours', {
                                    required: 'Duration is required',
                                    min: {
                                        value: 1,
                                        message: 'Duration must be at least 1 hour'
                                    },
                                    max: {
                                        value: 168,
                                        message: 'Duration cannot exceed 168 hours (7 days)'
                                    }
                                })}
                                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 ${
                                    errors.durationHours 
                                        ? 'border-red-500 focus:ring-red-500/50 glow-orange' 
                                        : 'border-slate-600 focus:border-blue-400 focus:ring-blue-400/50 hover:border-slate-500'
                                }`}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                                🕐
                            </div>
                        </div>
                        <div className="text-xs text-slate-400">
                            💡 Tip: 24h = 1 day, 168h = 7 days max
                        </div>
                        {errors.durationHours && (
                            <span className="flex items-center gap-1 text-red-400 text-xs">
                                ⚠️ {errors.durationHours.message}
                            </span>
                        )}
                    </div>

                    {/* Epic Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 border border-slate-600 hover:border-slate-500 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="flex items-center justify-center gap-2">
                                ❌ Cancel
                            </span>
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed glow-green pulse-glow"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Launching...
                                    </>
                                ) : (
                                    <>
                                        🚀 Launch Auction ⚡
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </form>
            </div>


        </div>
    )
}

export default CreateAuctionModal