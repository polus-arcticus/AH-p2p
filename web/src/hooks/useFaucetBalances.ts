import { useAccount, useReadContracts } from 'wagmi'
import { erc20Abi, erc1155Abi } from 'viem'
import staticContracts from '../assets/Static.json'

export const useFaucetBalances = () => {
    const { address, isConnected } = useAccount()
    
    // Get ERC20 token balance
    const { data: tokenData, refetch: refetchTokenData } = useReadContracts({
        allowFailure: false,
        contracts: [
            {
                address: staticContracts.exampleTokenAddr as `0x${string}`,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [address!],
            },
            {
                address: staticContracts.exampleTokenAddr as `0x${string}`,
                abi: erc20Abi,
                functionName: 'decimals',
            },
            {
                address: staticContracts.exampleTokenAddr as `0x${string}`,
                abi: erc20Abi,
                functionName: 'symbol',
            },
        ],
        query: {
            enabled: isConnected && !!address
        }
    })

    // Get ERC1155 NFT balance (token ID 2)
    const { data: nftData, refetch: refetchNftData } = useReadContracts({
        allowFailure: false,
        contracts: [
            {
                address: staticContracts.exampleNftAddr as `0x${string}`,
                abi: erc1155Abi,
                functionName: 'balanceOf',
                args: [address!, 2n], // Token ID 0 for Thor's Hammer
            },
        ],
        query: {
            enabled: isConnected && !!address
        }
    })
    
    const tokenBalance = tokenData ? {
        value: tokenData[0] as bigint,
        decimals: tokenData[1] as number,
        symbol: tokenData[2] as string,
        formatted: Number(tokenData[0]) / Math.pow(10, tokenData[1] as number)
    } : null
    
    const nftBalance = nftData ? {
        balance: nftData[0] as bigint,
        count: Number(nftData[0])
    } : null

    const refetchBalances = () => {
        refetchTokenData()
        refetchNftData()
    }

    return {
        tokenBalance,
        nftBalance,
        refetchTokenData,
        refetchNftData,
        refetchBalances,
        isConnected
    }
}
