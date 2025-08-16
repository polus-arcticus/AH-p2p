import {
    useDisconnect,
    useEnsAvatar,
    useEnsName,
    useConnect, useAccount
} from 'wagmi'
import type { Connector } from 'wagmi'
import { useState, useEffect, useContext } from 'react'
import { AHP2PContext } from '@/provider/AHP2PProvider/AHP2PProvider'

export function WalletOptions() {
    const { connectors, connect } = useConnect()

    return connectors.map((connector) => (
        <WalletOption
            key={connector.uid}
            connector={connector}
            onClick={() => connect({ connector })}
        />
    ))
}

function WalletOption({
    connector,
    onClick,
}: {
    connector: Connector
    onClick: () => void
}) {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        ; (async () => {
            const provider = await connector.getProvider()
            setReady(!!provider)
        })()
    }, [connector])

    return (
        <button 
            disabled={!ready} 
            onClick={onClick}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed glow-cyan"
        >
            🔗 {connector.name}
        </button>
    )
}
export function Account() {
    const { address } = useAccount()
    const { disconnect } = useDisconnect()
    const { data: ensName } = useEnsName({ address })
    const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

    return (
        <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-2">
            {ensAvatar && (
                <img 
                    alt="ENS Avatar" 
                    src={ensAvatar} 
                    className="w-8 h-8 rounded-full border-2 border-green-400 glow-green"
                />
            )}
            {address && (
                <div className="text-sm">
                    <div className="text-green-400 font-semibold">
                        {ensName ? `🎮 ${ensName}` : '👤 Player'}
                    </div>
                    <div className="text-slate-400 text-xs font-mono">
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </div>
                </div>
            )}
            <button 
                onClick={() => disconnect()}
                className="ml-2 px-3 py-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 glow-orange"
            >
                ⚡ Disconnect
            </button>
        </div>
    )
}

function ConnectWallet() {
    const { isConnected } = useAccount()
    if (isConnected) return <Account />
    return <WalletOptions />
}

export const NavBar = () => {
    const {loading, peerList } = useContext(AHP2PContext)

    return (
        <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 shadow-2xl">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo/Brand Section */}
                    <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent">
                            🎯 AUCTION HOUSE P2P
                        </div>
                        <div className="hidden md:block w-px h-8 bg-slate-600"></div>
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-slate-300">LIVE</span>
                        </div>
                    </div>

                    {/* Network Status Section */}
                    <div className="flex items-center gap-6">
                        {loading ? (
                            <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent"></div>
                                <span className="text-cyan-400 font-semibold">Connecting...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-2 glow-green">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-400 font-semibold">
                                    {Object.keys(peerList).length} 
                                </span>
                                <span className="text-slate-300 text-sm">
                                    {Object.keys(peerList).length === 1 ? 'Peer' : 'Peers'}
                                </span>
                                <span className="text-lg">🌐</span>
                            </div>
                        )}

                        {/* Wallet Connection */}
                        <ConnectWallet />
                    </div>
                </div>
            </div>
        </nav>
    )
}