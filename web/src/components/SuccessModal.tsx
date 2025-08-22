import React from 'react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  winnerAddress?: string
  finalBid?: string
  nftName?: string
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "🏆 Battle Victory!",
  message = "The auction has been successfully completed!",
  winnerAddress,
  finalBid,
  nftName
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-green-500/30 rounded-2xl shadow-2xl">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-2xl blur opacity-75"></div>
        
        <div className="relative p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Success icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-300 text-center mb-6">
            {message}
          </p>

          {/* Battle Results */}
          {(winnerAddress || finalBid || nftName) && (
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
                ⚔️ Battle Results
              </h3>
              
              {nftName && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">🖼️ Prize:</span>
                  <span className="text-white font-medium">{nftName}</span>
                </div>
              )}
              
              {winnerAddress && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">🏆 Champion:</span>
                  <span className="text-cyan-400 font-mono text-sm">
                    {winnerAddress.slice(0, 6)}...{winnerAddress.slice(-4)}
                  </span>
                </div>
              )}
              
              {finalBid && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">💰 Final Bid:</span>
                  <span className="text-green-400 font-bold">{finalBid} ETH</span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              🎮 Continue Gaming
            </button>
          </div>

          {/* Celebration particles effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            <div className="absolute top-8 right-8 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-green-300 rounded-full animate-bounce"></div>
            <div className="absolute bottom-4 right-4 w-1 h-1 bg-cyan-300 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    </div>
  )
}