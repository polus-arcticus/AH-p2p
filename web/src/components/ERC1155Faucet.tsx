import React from 'react'
import { useErc1155Faucet } from '../hooks/useFaucet'

const ERC1155Faucet: React.FC = () => {
  const {
    claimFaucetErc1155,
    isPending: erc1155Pending,
    isConfirming: erc1155Confirming,
    isConfirmed: erc1155Confirmed,
    isConnected: erc1155Connected,
    error: erc1155Error
  } = useErc1155Faucet()

  return (
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
  )
}

export default ERC1155Faucet