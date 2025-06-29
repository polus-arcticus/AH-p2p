import { useContext, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { HeliaContext } from '../providers/HeliaProvider'
import { useSwitchChain } from 'wagmi'

export const NavBar = () => {
    const { peerId, peerList } = useContext(HeliaContext)
    const location = useLocation()
    const { address, isConnected } = useAccount()
    const { connect, connectors } = useConnect()
    const { disconnect } = useDisconnect()
    const { switchChain, chains } = useSwitchChain()
    const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false)

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
                        
                        {/* Wallet Connection */}
                        {isConnected ? (
                            <div className="flex items-center space-x-2">
                                <div className="text-xs text-green-400 font-mono">
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </div>
                                <button
                                    onClick={() => disconnect()}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => connect({ connector: connectors[0] })}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                            >
                                Connect Wallet
                            </button>

                        )}
                        <div className="relative">
                            <button
                                onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
                            >
                                <span>Switch Chain</span>
                                <span>{isChainDropdownOpen ? '▲' : '▼'}</span>
                            </button>
                            {isChainDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                                    {chains.map((chain) => (
                                        <button
                                            key={chain.id}
                                            onClick={() => {
                                                switchChain({ chainId: chain.id })
                                                setIsChainDropdownOpen(false)
                                            }}
                                            className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                                        >
                                            {chain.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}   