import { useReadContract } from 'wagmi'
import staticContracts from '../assets/Static.json'

const MOCK_CONTRACTS = {
    englishAuctionAddr: (staticContracts as any).englishAuctionAddr
}

// Simple ABI for the usedNonces function
const englishAuctionAbi = [
    {
        name: 'usedNonces',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
] as const

export const useAuctionNonce = (address: `0x${string}` | undefined) => {
    const { data: nonce, isLoading, error } = useReadContract({
        address: MOCK_CONTRACTS.englishAuctionAddr as `0x${string}`,
        abi: englishAuctionAbi,
        functionName: 'usedNonces',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address
        }
    })

    return {
        nonce: nonce?.toString() || "0",
        isLoading,
        error
    }
} 