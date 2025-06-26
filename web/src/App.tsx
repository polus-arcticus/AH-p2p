import { useContext, useState } from 'react'
import { useNavigate } from 'react-router'
import { HeliaContext } from './providers/HeliaProvider'
import './App.css'

function App() {
  const { 
    peerId, 
    starting, 
    error, 
    peerList,
    chatMessages
  } = useContext(HeliaContext)

  const navigate = useNavigate()
  const [auctionInput, setAuctionInput] = useState('')

  const handleJoinAuction = (e: React.FormEvent) => {
    e.preventDefault()
    if (auctionInput.trim()) {
      navigate(`/room/${auctionInput.trim()}`)
      setAuctionInput('')
    }
  }

  if (starting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="text-white text-xl">Connecting to P2P Auction Network...</p>
          <p className="text-gray-300">Establishing WebRTC connections</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white text-xl">❌ Failed to connect to auction network</p>
          <p className="text-gray-300">Please refresh to try again</p>
        </div>
      </div>
    )
  }

  // Get unique auction rooms from chat messages
  const activeRooms = [...new Set(chatMessages.map(msg => msg.roomId))].filter(room => room)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Decentralized NFT Auction House
          </h1>
          <p className="text-gray-300 text-lg">
            P2P auctions with no central servers • WebRTC powered
          </p>
        </div>

        {/* Join Auction Form */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Join an Auction</h2>
          <form onSubmit={handleJoinAuction} className="flex gap-4">
            <input
              type="text"
              value={auctionInput}
              onChange={(e) => setAuctionInput(e.target.value)}
              placeholder="Enter auction room ID (e.g. nft-123)"
              className="flex-1 p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!auctionInput.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Join Auction
            </button>
          </form>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">Network Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Connected Peers:</span>
                <span className="text-green-400">{Object.keys(peerList).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your ID:</span>
                <span className="text-blue-400 font-mono text-xs">
                  {peerId ? `${peerId.slice(0, 8)}...${peerId.slice(-8)}` : 'Loading...'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">Active Rooms</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Discovered Rooms:</span>
                <span className="text-blue-400">{activeRooms.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Messages:</span>
                <span className="text-green-400">{chatMessages.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">Activity</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Bids:</span>
                <span className="text-yellow-400">
                  {chatMessages.filter(msg => msg.message.startsWith('BID:')).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Last Activity:</span>
                <span className="text-gray-300 text-xs">
                  {chatMessages.length > 0 
                    ? new Date(Math.max(...chatMessages.map(msg => msg.timestamp))).toLocaleTimeString()
                    : 'None'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Discovered Auction Rooms */}
        {activeRooms.length > 0 && (
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Discovered Auction Rooms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRooms.map((roomId) => {
                const roomMessages = chatMessages.filter(msg => msg.roomId === roomId)
                const bidMessages = roomMessages.filter(msg => msg.message.startsWith('BID:'))
                const uniqueParticipants = [...new Set(roomMessages.map(msg => msg.peerId))].length
                const highestBid = bidMessages.length > 0 
                  ? Math.max(...bidMessages.map(msg => parseFloat(msg.message.slice(4)) || 0))
                  : 0

                return (
                  <div
                    key={roomId}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/50 transition-all duration-200"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{roomId}</h3>
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Participants:</span>
                        <span className="text-blue-400">{uniqueParticipants}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Bids:</span>
                        <span className="text-green-400">{bidMessages.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">High Bid:</span>
                        <span className="text-yellow-400">
                          {highestBid > 0 ? `${highestBid} ETH` : 'No bids'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/room/${roomId}`)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg font-semibold transition-all duration-200"
                    >
                      Join Room
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">🚀 How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">1. 🔗 P2P Discovery</h3>
              <p className="text-gray-300">
                Peers find each other through WebRTC without central servers
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2. 💬 Real-time Bidding</h3>
              <p className="text-gray-300">
                Bids are shared instantly across all auction participants
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">3. ⛓️ On-chain Settlement</h3>
              <p className="text-gray-300">
                Winning bid bundle gets submitted to smart contract
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
