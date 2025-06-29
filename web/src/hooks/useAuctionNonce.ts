import { useEffect } from 'react'
import { useReadContract, useAccount } from 'wagmi'
import staticContracts from '../assets/Static.json'

export const useAuctionNonce = () => {
    const { chain, address } = useAccount()
    const { data: nonce, isLoading, error } = useReadContract({
        address: staticContracts.englishAuctionAddr as `0x${string}`,
        abi: staticContracts.englishAuctionAbi,
        functionName: 'usedNonces',
        args: [address],
        query: {
            enabled: !!address
        }
    })
    useEffect(() => {
        console.log('nonce', nonce)
        console.log('address', address)
        console.log('chain', chain)
    }, [nonce, chain, address])

    return {
        nonce,
        isLoading,
        error
    }
} 