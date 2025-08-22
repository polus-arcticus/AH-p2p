import React, { useState, useEffect } from 'react'
import { formatEther } from 'viem/utils'
import { useAccount } from 'wagmi'

interface AuctionDetailsCardProps {
  auction: {
    auctioneer?: string
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
  postBid: (bid: string) => Promise<void>
  highBid?: string
}

const AuctionDetailsCard: React.FC<AuctionDetailsCardProps> = ({ auction, postBid, highBid }) => {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(false)
  const [bidAmount, setBidAmount] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const {address} = useAccount()

  const isAuctioneer = address && auction?.auctioneer && address.toLowerCase() === auction.auctioneer.toLowerCase()

  const handlePlaceBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      alert('Please enter a valid bid amount')
      return
    }

    try {
      setIsSubmitting(true)
      await postBid(bidAmount)
      setBidAmount('') // Clear the input after successful bid
    } catch (error) {
      console.error('Failed to place bid:', error)
      alert('Failed to place bid. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConsumeAuction = async () => {
    try {
      setIsSubmitting(true)
      // TODO: Implement consume auction logic
      console.log('Consuming auction:', auction?.id)
      alert('Consume auction functionality to be implemented')
    } catch (error) {
      console.error('Failed to consume auction:', error)
      alert('Failed to consume auction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    console.log('auction', auction)
    if (!auction?.endTime) return

    const updateTimer = () => {
      try {
        const endTime = (auction.endTime as number) * 1000 // Convert Unix seconds to milliseconds
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
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 glow-green flex flex-col h-full">
      {/* Header with Logo, Title & Description */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🎯</div>
        <div>
          <h3 className="text-xl font-bold text-cyan-400">{auction.title || 'Untitled Battle'}</h3>
          <p className="text-sm text-slate-400">{auction.description || 'Auction Details'}</p>
        </div>
      </div>

      {/* Status and Timer Row */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-lg font-bold ${isActive ? 'text-green-400' : 'text-red-400'}`}>
          ⏰ {timeLeft}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          isActive 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {isActive ? '🔥 LIVE' : '💀 ENDED'}
        </span>
      </div>

      {/* Compact Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* NFT Info */}
        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-400 font-semibold text-sm">🖼️ NFT</span>
            <span className="text-orange-400 font-mono font-semibold text-sm">
              #{auction.nftTokenId || 'N/A'}
            </span>
          </div>
        </div>

        {/* Bid Info */}
        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 font-semibold text-sm">💰 Start</span>
            <span className="text-green-400 font-bold text-sm">
              {auction.startingBid ? formatEther(BigInt(auction.startingBid)) : '0'} 🪙
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 font-semibold text-sm">💰 High</span>
            <span className="text-green-400 font-bold text-sm">
              {highBid ? highBid : '0'} 🪙
            </span>
          </div>
        </div>
      </div>

      {/* Compact Action Buttons */}
      <div className="flex gap-2 mt-auto">
        {isActive ? (
          isAuctioneer ? (
            // Auctioneer view - Show consume auction button
            <button 
              onClick={handleConsumeAuction}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 glow-purple pulse-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
            >
              {isSubmitting ? '⏳' : '🏆 Consume Auction'}
            </button>
          ) : (
            // Non-auctioneer view - Show bid form
            <>
              <input
                type="number"
                step="0.01"
                min="0"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Bid amount..."
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 hover:border-slate-500 focus:border-green-400 text-white placeholder-slate-400 rounded-lg transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              <button 
                onClick={handlePlaceBid}
                disabled={isSubmitting || !bidAmount || parseFloat(bidAmount) <= 0}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 glow-green pulse-glow whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
              >
                {isSubmitting ? '⏳' : '⚔️ Bid'}
              </button>
            </>
          )
        ) : (
          <div className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-slate-400 font-semibold rounded-lg text-center text-sm">
            🏁 Concluded
          </div>
        )}
      </div>
    </div>
  )
}

export default AuctionDetailsCard
