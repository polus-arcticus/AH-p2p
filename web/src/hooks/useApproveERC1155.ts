import { useEffect, useCallback } from 'react'
import { 
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
  useAccount
} from 'wagmi'
import { useStaticData } from './useStaticData'

export function useApproveERC1155(nftContract?: `0x${string}`, onApprovalConfirmed?: () => void) {
  const { address } = useAccount()
  const { staticData } = useStaticData()
  
  const { 
    data: hash, 
    isPending, 
    writeContract 
  } = useWriteContract() 

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  // Read current approval status
  const { data: isApproved, refetch: refetchApproval } = useReadContract({
    address: nftContract,
    abi: staticData?.exampleNftAbi,
    functionName: 'isApprovedForAll',
    args: address && nftContract && staticData ? [address, staticData.englishAuctionAddr as `0x${string}`] : undefined,
    query: {
      enabled: !!(address && nftContract && staticData)
    }
  })

  // Refetch approval and balances when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchApproval()
      onApprovalConfirmed?.()
    }
  }, [isConfirmed, refetchApproval, onApprovalConfirmed])

  const approveERC1155 = useCallback((contractAddress: `0x${string}`) => {
    if (!staticData) return
    
    writeContract({
      address: contractAddress,
      abi: staticData.exampleNftAbi,
      functionName: 'setApprovalForAll',
      args: [staticData.englishAuctionAddr as `0x${string}`, true],
    })
  }, [writeContract, staticData])

  return {
    approveERC1155,
    isApproved: isApproved as boolean | undefined,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    refetchApproval
  }
} 