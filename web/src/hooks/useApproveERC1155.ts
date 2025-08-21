import * as React from 'react'
import { 
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
  useAccount
} from 'wagmi'
import staticData from '../assets/Static.json'

export function useApproveERC1155(nftContract?: `0x${string}`, onApprovalConfirmed?: () => void) {
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

  // Read current approval status
  const { data: isApproved, refetch: refetchApproval } = useReadContract({
    address: nftContract,
    abi: staticData.exampleNftAbi,
    functionName: 'isApprovedForAll',
    args: address && nftContract ? [address, staticData.englishAuctionAddr as `0x${string}`] : undefined,
    query: {
      enabled: !!(address && nftContract)
    }
  })

  // Refetch approval and balances when transaction is confirmed
  React.useEffect(() => {
    if (isConfirmed) {
      refetchApproval()
      onApprovalConfirmed?.()
    }
  }, [isConfirmed, refetchApproval, onApprovalConfirmed])

  const approveERC1155 = React.useCallback((contractAddress: `0x${string}`) => {
    writeContract({
      address: contractAddress,
      abi: staticData.exampleNftAbi,
      functionName: 'setApprovalForAll',
      args: [staticData.englishAuctionAddr as `0x${string}`, true],
    })
  }, [writeContract])

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