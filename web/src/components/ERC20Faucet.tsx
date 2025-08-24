import React from 'react'
import { useErc20Faucet } from '../hooks/useFaucet'

const ERC20Faucet: React.FC = () => {
  const {
    claimFaucetErc20,
    isPending: erc20Pending,
    isConfirming: erc20Confirming,
    isConfirmed: erc20Confirmed,
    isConnected: erc20Connected,
    error: erc20Error
  } = useErc20Faucet()

  return (
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
  )
}

export default ERC20Faucet