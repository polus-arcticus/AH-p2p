import {
    useDisconnect,
    useEnsAvatar,
    useEnsName,
    useConnect, 
    useAccount,
    useSwitchChain
} from 'wagmi'
import type { Connector } from 'wagmi'
import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router'
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
            className="px-0 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium text-xs rounded transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
            🔗 {connector.name}
        </button>
    )
}
export function Account() {
    const { address, chain } = useAccount()
    const { disconnect } = useDisconnect()
    const { data: ensName } = useEnsName({ address })
    const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

    return (
        <div className="flex items-center gap-1 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-lg px-1">
            {ensAvatar && (
                <img 
                    alt="ENS Avatar" 
                    src={ensAvatar} 
                    className="w-5 h-5 rounded-full border border-green-400"
                />
            )}
            {address && (
                <div className="text-xs">
                    <div className="text-green-400 font-medium">
                        {ensName ? `🎮 ${ensName}` : '👤'}
                    </div>
                    <div className="text-slate-400 text-xs font-mono">
                        {address.slice(0, 4)}...{address.slice(-4)}
                    </div>
                    {chain && (
                        <div className="text-cyan-400 text-xs font-medium">
                            🌐 {chain.name}
                        </div>
                    )}
                </div>
            )}
            <button 
                onClick={() => disconnect()}
                className="ml-1 px-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white text-xs font-medium rounded transition-all duration-200 transform hover:scale-105"
            >
                ⚡
            </button>
        </div>
    )
}

function ChainSwitcher() {
    const { chains, switchChain } = useSwitchChain()
    const [showChains, setShowChains] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setShowChains(!showChains)}
                className="px-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-medium rounded transition-all duration-200 transform hover:scale-105"
            >
                🔗
            </button>
            {showChains && (
                <div className="absolute top-full right-0 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg shadow-xl min-w-32 z-50">
                    {chains.map((chain) => (
                        <button
                            key={chain.id}
                            onClick={() => {
                                switchChain({ chainId: chain.id })
                                setShowChains(false)
                            }}
                            className="w-full px-1 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200"
                        >
                            🌐 {chain.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function ConnectWallet() {
    const { isConnected } = useAccount()
    if (isConnected) return <Account />
    return <WalletOptions />
}

export const NavBar = () => {
    const {loading } = useContext(AHP2PContext)

    return (
        <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 shadow-xl">
            <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                    {/* Logo/Brand Section */}
                    <div className="flex items-center gap-2">
                        <Link 
                            to="/" 
                            className="text-lg font-bold hover:scale-105 transition-transform duration-200 cursor-pointer flex items-center gap-2"
                        >
                            <span className="text-xl">🎯</span>
                            <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent">
                                AH P2P
                            </span>
                        </Link>
                        <div className="hidden md:block w-px h-4 bg-slate-600"></div>
                        <div className="hidden md:flex items-center gap-1 text-xs">
                            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-slate-300">LIVE</span>
                        </div>
                    </div>

                    {/* Network Status Section */}
                    <div className="flex items-center gap-2">
                        {loading ? (
                            <div className="flex items-center gap-1 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-lg px-2 py-1">
                                <div className="animate-spin rounded-full h-3 w-3 border border-cyan-400 border-t-transparent"></div>
                                <span className="text-cyan-400 font-medium text-xs">Connecting...</span>
                            </div>
                        ) : (<></>
                        )}

                        {/* Chain Switcher */}
                        <ChainSwitcher />

                        {/* Wallet Connection */}
                        <ConnectWallet />
                    </div>
                </div>
            </div>
        </nav>
    )
}