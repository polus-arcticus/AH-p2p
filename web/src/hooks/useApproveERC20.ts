import * as React from 'react'
import { 
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
  useAccount
} from 'wagmi'
import { maxUint256 } from 'viem'
import staticData from '../assets/Static.json'

export function useApproveERC20(tokenContract?: `0x${string}`, onApprovalConfirmed?: () => void) {
  const { address } = useAccount()
  
  const { 
    data: hash, 
    isPending, 
    writeContract 
  } = useWriteContract() 

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  // Read current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenContract,
    abi: staticData.exampleTokenAbi,
    functionName: 'allowance',
    args: address && tokenContract ? [address, staticData.englishAuctionAddr as `0x${string}`] : undefined,
    query: {
      enabled: !!(address && tokenContract)
    }
  })

  // Refetch allowance and balances when transaction is confirmed
  React.useEffect(() => {
    if (isConfirmed) {
      refetchAllowance()
      onApprovalConfirmed?.()
    }
  }, [isConfirmed, refetchAllowance, onApprovalConfirmed])

  const approveERC20 = React.useCallback((contractAddress: `0x${string}`) => {
    writeContract({
      address: contractAddress,
      abi: staticData.exampleTokenAbi,
      functionName: 'approve',
      args: [staticData.englishAuctionAddr as `0x${string}`, maxUint256],
    })
  }, [writeContract])

  return {
    approveERC20,
    allowance: allowance as bigint | undefined,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    refetchAllowance
  }
} 