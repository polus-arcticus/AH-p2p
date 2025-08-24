import * as React from 'react'
import { 
  useWaitForTransactionReceipt,
  useWriteContract,
  useAccount
} from 'wagmi'
import { useStaticData } from './useStaticData'

export function useErc20Faucet() {
  const { address } = useAccount()
  const { staticData } = useStaticData()
  
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
    if (!address || !staticData) return
    
    writeContract({
      address: staticData.exampleTokenAddr as `0x${string}`,
      abi: staticData.exampleTokenAbi,
      functionName: 'faucet',
      args: [],
    })
  }, [writeContract, address, staticData])

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
  const { staticData } = useStaticData()
  
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
    if (!address || !staticData) return

    console.log('claimFaucetErc1155', address, staticData)
    
    writeContract({
      address: staticData.exampleNftAddr as `0x${string}`,
      abi: staticData.exampleNftAbi,
      functionName: 'faucet',
      args: [],
    }, {
      onSuccess: () => {
        console.log('faucet success')
      },
      onError: (error) => {
        console.log('faucet error', error)
      }
    })
  }, [writeContract, address, staticData])

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