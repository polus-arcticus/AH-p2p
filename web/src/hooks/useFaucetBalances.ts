import { useAccount, useReadContracts } from 'wagmi'
import { erc20Abi, erc1155Abi } from 'viem'
import { useStaticData } from './useStaticData'

export const useFaucetBalances = () => {
    const { address, isConnected } = useAccount()
    const { staticData } = useStaticData()

    // Get ERC20 token balance
    const { data: tokenData, refetch: refetchTokenData } = useReadContracts({
        allowFailure: false,
        contracts: [
            {
                address: staticData?.exampleTokenAddr as `0x${string}`,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [address!],
            },
            {
                address: staticData?.exampleTokenAddr as `0x${string}`,
                abi: erc20Abi,
                functionName: 'decimals',
            },
            {
                address: staticData?.exampleTokenAddr as `0x${string}`,
                abi: erc20Abi,
                functionName: 'symbol',
            },
        ],
        query: {
            enabled: isConnected && !!address && !!staticData
        }
    })

    // Get ERC1155 NFT balance (token ID 2)
    const { data: nftData, refetch: refetchNftData } = useReadContracts({
        allowFailure: false,
        contracts: [
            {
                address: staticData?.exampleNftAddr as `0x${string}`,
                abi: erc1155Abi,
                functionName: 'balanceOf',
                args: [address!, 2n], // Token ID 0 for Thor's Hammer
            },
        ],
        query: {
            enabled: isConnected && !!address && !!staticData
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
