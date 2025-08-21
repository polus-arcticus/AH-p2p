import { useContext, useState } from 'react'
import { AHP2PContext } from './provider/AHP2PProvider/AHP2PProvider'
import { useAuctionsDB } from './hooks/useAuctionsDB'
import { useErc20Faucet, useErc1155Faucet } from './hooks/useFaucet'
import CreateAuctionModal from './components/CreateAuctionModal'
import ActiveAuctionsList from './components/ActiveAuctionsList'

function App() {
  const { loading } = useContext(AHP2PContext)
  const {
    createAuction
  } = useAuctionsDB()
  const {
    claimFaucetErc20,
    isPending: erc20Pending,
    isConfirming: erc20Confirming,
    isConfirmed: erc20Confirmed,
    isConnected: erc20Connected,
    error: erc20Error
  } = useErc20Faucet()
  
  const {
    claimFaucetErc1155,
    isPending: erc1155Pending,
    isConfirming: erc1155Confirming,
    isConfirmed: erc1155Confirmed,
    isConnected: erc1155Connected,
    error: erc1155Error
  } = useErc1155Faucet()

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
            <button
              onClick={claimFaucetErc20}
              disabled={!erc20Connected || erc20Pending || erc20Confirming}
              className={`group relative bg-slate-800/50 backdrop-blur-sm border rounded-lg p-3 text-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                erc20Error ? 'border-red-500 hover:border-red-400' : 'border-slate-700 hover:border-green-400'
              }`}
            >
              <div className="text-2xl mb-1">💰</div>
              <div className={`text-lg font-bold mb-1 ${
                erc20Error ? 'text-red-400' : 'text-green-400'
              }`}>
                {(erc20Pending || erc20Confirming) ? 'Mining...' : erc20Error ? 'Failed' : 'Claim ERC20'}
              </div>
              <div className="text-slate-400 text-xs">
                {erc20Error ? 
                  (erc20Error.message?.includes('rejected') || erc20Error.message?.includes('denied') ? 
                    'Transaction rejected' : 'Transaction failed'
                  ) : 'Get Test Tokens'
                }
              </div>
              {erc20Confirmed && (
                <div className="absolute top-1 right-1 text-green-400 text-sm">✅</div>
              )}
              {erc20Error && (
                <div className="absolute top-1 right-1 text-red-400 text-sm">❌</div>
              )}
            </button>
            <button
              onClick={claimFaucetErc1155}
              disabled={!erc1155Connected || erc1155Pending || erc1155Confirming}
              className={`group relative bg-slate-800/50 backdrop-blur-sm border rounded-lg p-3 text-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                erc1155Error ? 'border-red-500 hover:border-red-400' : 'border-slate-700 hover:border-orange-400'
              }`}
            >
              <div className="text-2xl mb-1">🎨</div>
              <div className={`text-lg font-bold mb-1 ${
                erc1155Error ? 'text-red-400' : 'text-orange-400'
              }`}>
                {(erc1155Pending || erc1155Confirming) ? 'Mining...' : erc1155Error ? 'Failed' : 'Claim NFT'}
              </div>
              <div className="text-slate-400 text-xs">
                {erc1155Error ? 
                  (erc1155Error.message?.includes('rejected') || erc1155Error.message?.includes('denied') ? 
                    'Transaction rejected' : 'Transaction failed'
                  ) : 'Get Thor\'s Hammer'
                }
              </div>
              {erc1155Confirmed && (
                <div className="absolute top-1 right-1 text-orange-400 text-sm">✅</div>
              )}
              {erc1155Error && (
                <div className="absolute top-1 right-1 text-red-400 text-sm">❌</div>
              )}
            </button>
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
