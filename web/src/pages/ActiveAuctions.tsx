import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { HeliaContext } from '../providers/HeliaProvider'
import { CreateAuctionModal } from '../components/CreateAuctionModal'

export const ActiveAuctions = () => {
    const {
        activeAuctions,
        refreshActiveAuctions,
        starting,
        error,
        createAuction
    } = useContext(HeliaContext)

    const [showCreateForm, setShowCreateForm] = useState(false)

    // Auto-refresh auctions when page loads
    useEffect(() => {
        if (!starting && !error) {
            refreshActiveAuctions()
        }
    }, [starting, error, refreshActiveAuctions])



    if (starting) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
                    <p className="text-white text-xl">Connecting to P2P Network...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center space-y-4">
                    <p className="text-white text-xl">❌ Connection Failed</p>
                    <Link to="/" className="text-purple-300 hover:text-white transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        )
    }

    // Filter out expired auctions
    const currentTime = Date.now()
    const liveAuctions = activeAuctions.filter(auction => auction.endTime > currentTime)
    const expiredAuctions = activeAuctions.filter(auction => auction.endTime <= currentTime)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Active Auctions
                    </h1>
                    <p className="text-gray-300">
                        Discover and join live P2P auctions • {liveAuctions.length} active
                    </p>
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={refreshActiveAuctions}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        🔄 Refresh
                    </button>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                    >
                        + Create Auction
                    </button>
                </div>
            </div>

            {/* Live Auctions */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Live Auctions</h2>

                {liveAuctions.length === 0 ? (
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
                        <div className="text-6xl mb-4">🏛️</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Active Auctions</h3>
                        <p className="text-gray-400 mb-6">
                            Be the first to create an auction or wait for peers to broadcast theirs
                        </p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                        >
                            Create First Auction
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {liveAuctions.map((auction) => {
                            const timeLeft = auction.endTime - currentTime
                            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
                            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

                            return (
                                <div
                                    key={auction.id}
                                    className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-400/50 transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-semibold text-white">
                                            {auction.title}
                                        </h3>
                                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                            LIVE
                                        </span>
                                    </div>

                                    <p className="text-gray-300 mb-4 line-clamp-2">{auction.description}</p>

                                    <div className="bg-white/5 rounded-lg p-3 mb-4 space-y-2">
                                        <div className="text-sm text-gray-400 mb-1">Contract Details:</div>
                                        <div className="text-xs font-mono text-blue-400">
                                            NFT: {auction.nftContract.slice(0, 10)}...{auction.nftContract.slice(-8)}
                                        </div>
                                        <div className="text-xs font-mono text-green-400">
                                            Token ID: {auction.nftTokenId}
                                        </div>
                                        <div className="text-xs font-mono text-yellow-400">
                                            Payment: {auction.tokenContract.slice(0, 10)}...{auction.tokenContract.slice(-8)}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Starting Bid:</span>
                                            <span className="text-green-400">{auction.startingBid} ERC20</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Current High:</span>
                                            <span className="text-yellow-400">{auction.currentHighBid} ERC20</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Bids:</span>
                                            <span className="text-blue-400">{auction.bidCount}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Time Left:</span>
                                            <span className="text-red-400">
                                                {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Creator:</span>
                                            <span className="text-purple-400 font-mono text-xs">
                                                {auction.creator.slice(0, 6)}...{auction.creator.slice(-4)}
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/room/${auction.id}`}
                                        className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold text-center transition-all duration-200"
                                    >
                                        Join Auction
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Expired Auctions */}
            {expiredAuctions.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Recently Ended</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {expiredAuctions.slice(0, 6).map((auction) => (
                            <div
                                key={auction.id}
                                className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 opacity-75"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-semibold text-white">
                                        {auction.title}
                                    </h3>
                                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                        ENDED
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Final Bid:</span>
                                        <span className="text-yellow-400">{auction.currentHighBid} ERC20</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Total Bids:</span>
                                        <span className="text-blue-400">{auction.bidCount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Ended:</span>
                                        <span className="text-red-400">
                                            {new Date(auction.endTime).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Auction Modal */}
            <CreateAuctionModal
                showCreateForm={showCreateForm}
                setShowCreateForm={setShowCreateForm}
                createAuction={createAuction}
            />
        </div>
    )
}