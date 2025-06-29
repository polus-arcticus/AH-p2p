import { useParams, Link } from "react-router"
import { useAuctionRoom } from '../../hooks/useAuctionRoom'
import { useAuctionData } from '../../hooks/useAuctionData'
import { AuctionHeader } from './AuctionHeader'
import { BiddingSection } from './BiddingSection'
import { ConsumeAuctionSection } from './ConsumeAuctionSection'
import { ActivityFeed } from './ActivityFeed'

export const Auction = () => {
    const { roomId } = useParams()
    
    // Get auction data for layout decisions
    const { isAuctioneer } = useAuctionData(roomId)
    // Only need room data for loading/error states
    const { starting, error } = useAuctionRoom(roomId)

    if (starting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
                    <p className="text-white text-xl">Connecting to P2P Network...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-white text-xl">❌ Connection Failed</p>
                    <Link to="/" className="text-purple-300 hover:text-white transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                    <AuctionHeader
                        roomId={roomId}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                        <div className="lg:col-span-1 space-y-4">
                            {isAuctioneer && (
                                <ConsumeAuctionSection
                                    roomId={roomId}
                                />
                            )}
                            <BiddingSection
                                roomId={roomId}
                            />
                        </div>

                        <ActivityFeed
                            roomId={roomId}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
