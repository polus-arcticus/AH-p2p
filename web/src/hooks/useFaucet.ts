import * as React from 'react'
import { 
  useWaitForTransactionReceipt,
  useWriteContract,
  useAccount
} from 'wagmi'
import staticData from '../assets/Static.json'

export function useErc20Faucet() {
  const { address } = useAccount()
  
  const { 
    data: hash, 
    isPending, 
    writeContract,
    error: writeError
  } = useWriteContract() 

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } =
    useWaitForTransactionReceipt({
      hash,
    })

  const claimFaucetErc20 = React.useCallback(() => {
    if (!address) return
    
    writeContract({
      address: staticData.exampleTokenAddr as `0x${string}`,
      abi: staticData.exampleTokenAbi,
      functionName: 'faucet',
      args: [],
    })
  }, [writeContract, address])

  return {
    claimFaucetErc20,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isConnected: !!address,
    error: writeError || receiptError
  }
}

export function useErc1155Faucet() {
  const { address } = useAccount()
  
  const { 
    data: hash, 
    isPending, 
    writeContract,
    error: writeError
  } = useWriteContract() 

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } =
    useWaitForTransactionReceipt({
      hash,
    })

  const claimFaucetErc1155 = React.useCallback(() => {
    if (!address) return
    
    writeContract({
      address: staticData.exampleNftAddr as `0x${string}`,
      abi: staticData.exampleNftAbi,
      functionName: 'faucet',
      args: [],
    })
  }, [writeContract, address])

  return {
    claimFaucetErc1155,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isConnected: !!address,
    error: writeError || receiptError
  }
}