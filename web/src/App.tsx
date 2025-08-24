import { useContext, useState } from 'react'
import { AHP2PContext } from './provider/AHP2PProvider/AHP2PProvider'
import { useAuctionsDB } from './hooks/useAuctionsDB'
import CreateAuctionModal from './components/CreateAuctionModal'
import ActiveAuctionsList from './components/ActiveAuctionsList'
import ERC20Faucet from './components/ERC20Faucet'
import ERC1155Faucet from './components/ERC1155Faucet'
import { useAccount } from 'wagmi'

function App() {
  const { loading } = useContext(AHP2PContext)
  const { address } = useAccount()
  const {
    createAuction
  } = useAuctionsDB()

  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleCreateAuction = () => {
    setShowCreateForm(true)
  }

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-400 border-t-transparent glow-green"></div>
          <p className="mt-4 text-xl text-green-400 font-semibold animate-pulse">
            Connect Wallet to Begin Joining the Auction House
          </p>
          
          <div className="mt-8 p-6 bg-black/30 backdrop-blur-sm rounded-lg border border-cyan-400/20">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center justify-center gap-2">
              🔐 Security Notice
            </h3>
            <div className="text-sm text-gray-300 space-y-3 text-left">
              <p>
                <span className="text-green-400 font-medium">Step 1:</span> You'll be asked to sign a message to generate your persistent libp2p peer ID. This creates your unique identity in the P2P network.
              </p>
              <p>
                <span className="text-orange-400 font-medium">Step 2:</span> A second signature will be requested to establish your OrbitDB identity for secure database operations.
              </p>
              <p className="text-xs text-gray-400 mt-4 italic">
                💡 These signatures are free and don't involve any transactions - they only create your P2P identities.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
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
        <div className="relative z-10 container mx-auto px-4 py-4">
          {/* Header Section */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent mb-2 pulse-glow">
              🎯 AUCTION HOUSE P2P
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto">
              Decentralized auctions in the ultimate P2P gaming experience.
            </p>
          </div>

          {/* Action Section */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleCreateAuction}
              className="group relative px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold text-sm rounded-lg transition-all duration-300 transform hover:scale-105 glow-green"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-lg">🚀</span>
                Create New Auction
                <span className="text-lg">⚡</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>

          {/* Faucet Claims Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <ERC20Faucet />
            <ERC1155Faucet />
          </div>

          {/* Auctions List */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-4 glow-green">
            <h2 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
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
