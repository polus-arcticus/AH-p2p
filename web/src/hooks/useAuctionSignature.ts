import { useSignTypedData, useChainId, useAccount } from 'wagmi'
import { keccak256 } from 'viem'
import { useStaticData } from './useStaticData'

// Type definitions from the test file
export const AuctionAuthSig = [
    { name: 'auctioneer', type: 'address' },
    { name: 'auctioneerNonce', type: 'uint256' },
    { name: 'nft', type: 'address' },
    { name: 'nftId', type: 'uint256' },
    { name: 'token', type: 'address' },
    { name: 'bidStart', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
]

export const Bid = [
    { name: 'bidder', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'bidderNonce', type: 'uint256' },
    { name: 'auctionSigHash', type: 'bytes32' }
]

export const Auction = [
    { name: 'auctioneer', type: 'address' },
    { name: 'auctioneerNonce', type: 'uint256' },
    { name: 'nft', type: 'address' },
    { name: 'nftId', type: 'uint256' },
    { name: 'token', type: 'address' },
    { name: 'bidStart', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'auctionSigHash', type: 'bytes32' },
    { name: 'bids', type: 'Bid[]' },
    { name: 'bidSigs', type: 'bytes[]' }
]

export interface AuctionAuthSigMessage extends Record<string, unknown> {
    auctioneer: string
    auctioneerNonce: bigint
    nft: string
    nftId: bigint
    token: string
    bidStart: bigint
    deadline: number
}

export interface BidMessage extends Record<string, unknown> {
    bidder: string
    amount: bigint
    bidderNonce: bigint
    auctionSigHash: string
}

export interface AuctionMessage extends Record<string, unknown> {
    auctioneer: string
    auctioneerNonce: bigint
    nft: string
    nftId: bigint
    token: string
    bidStart: bigint
    deadline: number
    auctionSigHash: string
    bids: BidMessage[]
    bidSigs: string[]
}

export const useAuctionSignature = () => {
    const chainId = useChainId()
    const { address } = useAccount()
    const { staticData } = useStaticData()
    const { signTypedData, isPending, error } = useSignTypedData()

    const domain = {
        name: 'EnglishAuction',
        version: '1',
        chainId: chainId,
        verifyingContract: staticData?.englishAuctionAddr as `0x${string}`
    }

    const signAuctionAuth = (message: AuctionAuthSigMessage) => {
        return new Promise<{ signature: `0x${string}`, sigHash: `0x${string}` }>((resolve, reject) => {
            signTypedData(
                {
                    domain,
                    types: {
                        AuctionAuthSig
                    },
                    primaryType: 'AuctionAuthSig',
                    message
                },
                {
                    onSuccess: (signature) => {
                        const sigHash = keccak256(signature)
                        resolve({ signature, sigHash })
                    },
                    onError: (error) => {
                        reject(error)
                    }
                }
            )
        })
    }

    const signBid = (message: BidMessage) => {
        return new Promise<`0x${string}`>((resolve, reject) => {
            signTypedData(
                {
                    domain,
                    types: {
                        Bid
                    },
                    primaryType: 'Bid',
                    message
                },
                {
                    onSuccess: (signature) => {
                        resolve(signature)
                    },
                    onError: (error) => {
                        reject(error)
                    }
                }
            )
        })
    }

    const signAuction = (message: AuctionMessage) => {
        return new Promise<`0x${string}`>((resolve, reject) => {
            signTypedData(
                {
                    domain,
                    types: {
                        Auction,
                        Bid
                    },
                    primaryType: 'Auction',
                    message
                },
                {
                    onSuccess: (signature) => {
                        resolve(signature)
                    },
                    onError: (error) => {
                        reject(error)
                    }
                }
            )
        })
    }

    return {
        signAuctionAuth,
        signBid,
        signAuction,
        isPending,
        error,
        domain,
        address
    }
} 