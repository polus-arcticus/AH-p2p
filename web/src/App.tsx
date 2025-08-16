import { useContext, useState } from 'react'
import { AHP2PContext } from './provider/AHP2PProvider/AHP2PProvider'
import { useAuctionsDB } from './hooks/useAuctionsDB'
import CreateAuctionModal from './components/CreateAuctionModal'
import ActiveAuctionsList from './components/ActiveAuctionsList'

function App() {
  const { loading } = useContext(AHP2PContext)
  const {
    createAuction
  } = useAuctionsDB()

  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleCreateAuction = () => {
    setShowCreateForm(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-400 border-t-transparent glow-green"></div>
            <p className="mt-4 text-xl text-green-400 font-semibold animate-pulse">
              Connecting to P2P Network...
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 container mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent mb-4 pulse-glow">
              🎯 AUCTION HOUSE P2P
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Welcome to the future of decentralized auctions. Create, bid, and win in the ultimate P2P gaming experience.
            </p>
          </div>

          {/* Action Section */}
          <div className="flex justify-center mb-12">
            <button
              onClick={handleCreateAuction}
              className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl glow-green"
            >
              <span className="relative z-10 flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                Create New Auction
                <span className="text-2xl">⚡</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>

          {/* Gaming Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center hover:border-green-400 transition-colors duration-300">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-green-400">Active</div>
              <div className="text-slate-400">Auctions</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center hover:border-orange-400 transition-colors duration-300">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-2xl font-bold text-orange-400">P2P</div>
              <div className="text-slate-400">Network</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center hover:border-cyan-400 transition-colors duration-300">
              <div className="text-3xl mb-2">🎮</div>
              <div className="text-2xl font-bold text-cyan-400">Gaming</div>
              <div className="text-slate-400">Experience</div>
            </div>
          </div>

          {/* Auctions List */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 glow-green">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              🔥 Live Auctions
            </h2>
            <ActiveAuctionsList />
          </div>
        </div>
      )}
      
      <CreateAuctionModal
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        createAuction={createAuction}
      />
    </div>
  )
}

export default App
