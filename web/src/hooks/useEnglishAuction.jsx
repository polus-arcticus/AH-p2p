import {useState,useEffect,useCallback} from 'react'

import { useWeb3React } from '@web3-react/core'

import { getEnglishAuction } from './utils'

export const useCreateAuction = (auction)=> {
  const [auctionData, setAuctionData] = useState({
    nftId: null,
    nftAddress: null,
    startPrice: null,
    tokenAddress: null,
    deadline: null,
    signWith: null
  })

  //const [chain, setChain] = useState(null)
  const [contract, setContract] = useState(null)
  const { account, provider } = useWeb3React()
us
  const fetchEnglishAuction = useCallback(() =>{
    const englishAuction = getEnglishAuction(provider)
    setContract(englishAuction)
  }, [])

  const createAuction = useCallback((data) => {
    setAuctionData(data)
    // typed
    // signed
    // set
    // create 
  }, [])

  const addBid = useCallback((bid, bidSig) => {
  })

  useEffect(() => {
    if (!contract) {
      fetchEnglishAuction()
    }
  },[])
}
