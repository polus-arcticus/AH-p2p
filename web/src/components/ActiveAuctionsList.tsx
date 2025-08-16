import React, { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useAuctionsDB } from '../hooks/useAuctionsDB'

interface Auction {
  id: string
  title: string
  description: string
  nftContract: string
  nftTokenId: string
  tokenContract: string
  startingBid: string
  endTime: string
  createdAt: string
  [key: string]: any
}

const ActiveAuctionsList: React.FC = () => {
  const { getAuctions, watchAuctions } = useAuctionsDB()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true)
        setError(null)
        const auctionsData = await getAuctions()
        console.log('auctionsData', auctionsData) 
        if (auctionsData) {
          // Convert the auctions object to an array if needed
          const auctionsArray = Array.isArray(auctionsData) 
            ? auctionsData 
            : Object.entries(auctionsData).map(([id, data]) => ({
                id,
                ...(data as any)
              }))
          
          setAuctions(auctionsArray)
        } else {
          setAuctions([])
        }
      } catch (err) {
        console.error('Error fetching auctions:', err)
        setError('Failed to fetch auctions')
      } finally {
        setLoading(false)
      }
    }

    fetchAuctions()
    watchAuctions()

  }, [getAuctions, watchAuctions])

  const formatEndTime = (endTime: string) => {
    try {
      const date = new Date(endTime)
      return date.toLocaleString()
    } catch {
      return endTime
    }
  }

  const isAuctionActive = (endTime: string) => {
    try {
      const end = new Date(endTime)
      return end > new Date()
    } catch {
      return false
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-400 border-t-transparent glow-green"></div>
          <div className="absolute inset-0 rounded-full border-4 border-green-400/20 animate-pulse"></div>
        </div>
        <div className="mt-6 text-xl text-green-400 font-semibold animate-pulse">
          🎯 Scanning P2P Network for Epic Auctions...
        </div>
        <div className="mt-2 text-slate-400 text-sm">
          ⚡ Connecting to auction arena
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-xl text-red-400 font-semibold mb-2">
          Connection to Auction Arena Failed
        </div>
        <div className="text-slate-400 mb-6 text-center max-w-md">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 glow-orange"
        >
          <span className="flex items-center gap-2">
            🔄 Reconnect to Arena
          </span>
        </button>
      </div>
    )
  }

  if (auctions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-8xl mb-6 opacity-50">🏟️</div>
        <div className="text-2xl text-slate-300 font-semibold mb-2">
          The Auction Arena is Empty
        </div>
        <div className="text-slate-400 text-center max-w-md mb-6">
          No epic battles are currently raging in the P2P auction arena. Be the first to launch an auction and start the excitement!
        </div>
        <div className="flex items-center gap-2 text-green-400 animate-pulse">
          <span>🚀</span>
          <span className="text-sm font-medium">Ready to create your first auction?</span>
          <span>⚡</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Epic Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent mb-2">
          ⚔️ Battle Arena ({auctions.length} Active)
        </h2>
        <p className="text-slate-400">
          {auctions.length === 1 ? 'One epic auction' : `${auctions.length} epic auctions`} currently live in the P2P arena
        </p>
      </div>
      
      {/* Gaming Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {auctions.map((auction) => (
          <div
            key={auction.id}
            className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:border-green-400 hover:shadow-2xl hover:shadow-green-400/20 hover:-translate-y-2 glow-green"
          >
            {/* Gaming Card Header */}
            <div className="mb-4">
              {/* Pulsing Corner Indicator */}
              <div className="absolute top-3 right-3">
                <div className={`w-3 h-3 rounded-full ${isAuctionActive(auction.endTime) ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors duration-300">
                🎯 {auction.title || 'Untitled Auction'}
              </h3>
              
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isAuctionActive(auction.endTime) 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {isAuctionActive(auction.endTime) ? '🔥 LIVE' : '💀 ENDED'}
                </span>
                <div className="text-xs text-slate-400">
                  {isAuctionActive(auction.endTime) ? '⚡ Battle in progress' : '🏁 Battle concluded'}
                </div>
              </div>
              
              {auction.description && (
                <p className="text-slate-300 text-sm leading-relaxed line-clamp-2">
                  {auction.description}
                </p>
              )}
            </div>

            {/* Gaming Stats Section */}
            <div className="border-t border-slate-700 pt-4 space-y-3">
              {/* Token ID */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  🆔 <span>Token ID</span>
                </span>
                <span className="text-orange-400 font-mono font-semibold">
                  #{auction.nftTokenId || 'N/A'}
                </span>
              </div>
              
              {/* Starting Bid */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  💰 <span>Starting Bid</span>
                </span>
                <span className="text-green-400 font-bold text-lg">
                  {auction.startingBid || '0'} 🪙
                </span>
              </div>
              
              {/* End Time */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  ⏰ <span>Battle Ends</span>
                </span>
                <span className="text-cyan-400 font-medium text-sm">
                  {formatEndTime(auction.endTime)}
                </span>
              </div>
              
              {/* Contract Address */}
              {auction.nftContract && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                  <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                    🖼️ <span>NFT Contract</span>
                  </div>
                  <div className="font-mono text-xs text-slate-300 break-all">
                    {auction.nftContract}
                  </div>
                </div>
              )}
            </div>

            {/* Epic Action Buttons */}
            <div className="mt-6 flex gap-3">
              <Link
                to={`/auction/${auction._id}`}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 text-center no-underline glow-cyan"
              >
                <span className="flex items-center justify-center gap-2">
                  👁️ View Battle
                </span>
              </Link>
              
              {isAuctionActive(auction.endTime) && (
                <button
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 glow-green pulse-glow"
                  onClick={() => {
                    // TODO: Implement place bid functionality
                    console.log('Place bid on auction:', auction.id)
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    ⚔️ Join Battle
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ActiveAuctionsList