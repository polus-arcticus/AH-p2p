import {useState,useEffect,useCallback} from 'react'

import { useWeb3React } from '@web3-react/core'

import { getEnglishAuction } from './utils'
import { EIP712DOMAIN, AuctionAuthSig, Auction, Bid } from './type-hashes'
import {ethers} from 'ethers'

export const useCreateAuction = (auction)=> {
  const [auctionData, setAuctionData] = useState(null)

  //const [chain, setChain] = useState(null)
  const [contract, setContract] = useState(null)
  const { account, provider, chainId } = useWeb3React()
  
  const fetchEnglishAuction = useCallback(() =>{
    const englishAuction = getEnglishAuction(provider)
    setContract(englishAuction)
  }, [])

  const createAuction = useCallback(async (data) => {
    const englishAuction = getEnglishAuction(provider)
    
    let domain = {
      name:  'EnglishAuction',
      version: '1',
      chainId: chainId,
      verifyingContract: englishAuction.address
    }
    let createAuction = {
      auctioneer: data.signWith,
      nft: data.nftAddress,
      nftId: data.nftId,
      token: data.tokenAddress,
      bidStart: ethers.utils.formatUnits(data.startPrice, 0),
      deadline: Math.floor(data.deadline.getTime() / 1000),
    }
    const signer = provider.getSigner()
    console.log(signer)
    const auctionSigHash = ethers.utils.keccak256(await signer._signTypedData(
      domain,
      { AuctionAuthSig },
      createAuction
    ))
    let auction ={
      ...createAuction,
      auctionSigHash: auctionSigHash,
      bids: [],
      bidSigs: []
    }
    setAuctionData(auction)
    

  }, [account, provider])

  const addBid = useCallback((bid, bidSig) => {
  })

  return { auctionData, createAuction }
}
