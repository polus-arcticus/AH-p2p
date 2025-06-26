import { useContext } from 'react'
import { Link, useLocation } from 'react-router'
import { HeliaContext } from '../providers/HeliaProvider'

export const NavBar = () => {
    const { peerId, peerList } = useContext(HeliaContext)
    const location = useLocation()
    
    return (
        <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="text-white font-bold text-xl hover:text-purple-300 transition-colors"
                        >
                            🏛️ AH-P2P
                        </Link>
                        <Link
                            to="/auctions"
                            className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                        >
                            Active Auctions
                        </Link>
                        {location.pathname.startsWith('/room/') && (
                            <span className="text-gray-300">
                                → Auction {location.pathname.split('/')[2]}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-300">
                            <span className="text-green-400">●</span> {Object.keys(peerList).length} peers
                        </div>
                        <div className="text-xs text-gray-400">
                            {peerId ? `${peerId.slice(0, 8)}...${peerId.slice(-8)}` : 'Connecting...'}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}   