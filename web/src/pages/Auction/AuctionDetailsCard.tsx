import React, { useState, useEffect } from 'react'

interface AuctionDetailsCardProps {
  auction: {
    id?: string
    title?: string
    description?: string
    nftContract?: string
    nftTokenId?: string
    tokenContract?: string
    startingBid?: string
    endTime?: string | number
    createdAt?: string
    [key: string]: any
  } | null
}

const AuctionDetailsCard: React.FC<AuctionDetailsCardProps> = ({ auction }) => {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(false)

  useEffect(() => {
    if (!auction?.endTime) return

    const updateTimer = () => {
      try {
        const endTime = typeof auction.endTime === 'string' 
          ? new Date(auction.endTime).getTime()
          : (auction.endTime || 0)
        const now = Date.now()
        const difference = endTime - now

        if (difference > 0) {
          setIsActive(true)
          const days = Math.floor(difference / (1000 * 60 * 60 * 24))
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((difference % (1000 * 60)) / 1000)

          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h ${minutes}m`)
          } else if (hours > 0) {
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
          } else {
            setTimeLeft(`${minutes}m ${seconds}s`)
          }
        } else {
          setIsActive(false)
          setTimeLeft('Battle Concluded')
        }
      } catch (error) {
        setTimeLeft('Invalid time')
        setIsActive(false)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [auction?.endTime])

  if (!auction) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl text-red-400 font-semibold mb-2">
            Battle Not Found
          </div>
          <div className="text-slate-400 text-center">
            This auction may have been removed or doesn't exist in the P2P arena.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 glow-green">
      {/* Epic Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">
              🎯 {auction.title || 'Untitled Battle'}
            </h1>
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              isActive 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isActive ? '🔥 LIVE BATTLE' : '💀 BATTLE ENDED'}
            </span>
            <div className="text-slate-400 text-sm">
              {isActive ? '⚡ Arena is active' : '🏁 Combat concluded'}
            </div>
          </div>
        </div>
      </div>

      {/* Battle Timer */}
      <div className="bg-slate-900/50 border border-slate-600 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏰</span>
            <span className="text-slate-300 font-semibold">Battle Timer</span>
          </div>
          <div className={`text-2xl font-bold ${isActive ? 'text-green-400' : 'text-red-400'}`}>
            {timeLeft}
          </div>
        </div>
        {isActive && (
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Description */}
      {auction.description && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center gap-2">
            📝 Battle Description
          </h3>
          <p className="text-slate-300 leading-relaxed bg-slate-900/30 p-4 rounded-xl border border-slate-600">
            {auction.description}
          </p>
        </div>
      )}

      {/* Battle Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* NFT Info */}
        <div className="bg-slate-900/50 border border-slate-600 rounded-xl p-4">
          <h4 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
            🖼️ NFT Asset
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Token ID</span>
              <span className="text-orange-400 font-mono font-semibold">
                #{auction.nftTokenId || 'N/A'}
              </span>
            </div>
            {auction.nftContract && (
              <div>
                <div className="text-slate-400 text-xs mb-1">Contract Address</div>
                <div className="font-mono text-xs text-slate-300 break-all bg-slate-800 p-2 rounded">
                  {auction.nftContract}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bid Info */}
        <div className="bg-slate-900/50 border border-slate-600 rounded-xl p-4">
          <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
            💰 Battle Stakes
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Starting Bid</span>
              <span className="text-green-400 font-bold text-lg">
                {auction.startingBid || '0'} 🪙
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Bid</span>
              <span className="text-yellow-400 font-bold text-lg">
                {auction.startingBid || '0'} 🪙
              </span>
            </div>
            {auction.tokenContract && (
              <div>
                <div className="text-slate-400 text-xs mb-1">Payment Token</div>
                <div className="font-mono text-xs text-slate-300 break-all bg-slate-800 p-2 rounded">
                  {auction.tokenContract}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {isActive ? (
          <>
            <button className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 glow-green pulse-glow">
              <span className="flex items-center justify-center gap-2 text-lg">
                ⚔️ Place Bid & Join Battle
              </span>
            </button>
            <button className="px-6 py-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
              <span className="flex items-center justify-center gap-2">
                👁️ Watch Battle
              </span>
            </button>
          </>
        ) : (
          <div className="flex-1 px-6 py-4 bg-slate-700 border border-slate-600 text-slate-400 font-semibold rounded-xl text-center">
            <span className="flex items-center justify-center gap-2">
              🏁 Battle Has Concluded
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuctionDetailsCard
