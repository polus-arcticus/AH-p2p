import { useState, useEffect } from 'react'

import { Container } from '@chakra-ui/react'

import { useAuctionRoom } from '@/hooks/useEnglishAuction'
import {useWeb3React} from '@web3-react/core'
import {useNft, useFetchNftBalance,useGetTokenBalance,  useFetchNftAllowance, useTokenAllowance} from '@/hooks/useExamples'

import {useParams} from 'react-router-dom'

import  {BasicStatistics} from './BasicStatistics'

export const Auction = () => {
  const {account} = useWeb3React()

  const {
    createAllowance: createNftAllowance
  } = useNft()

  const {
    allowance:auctioneerNftAllowance,
    fetchAllowance:fetchAuctioneerNftAllowance
  } = useFetchNftAllowance()

  const {
    fetchNftBalance: fetchAuctioneerNftBalance,
    balance: auctioneerNftBalance
  } = useFetchNftBalance()

  const {
    allowance:tokenAllowance,
    fetchAllowance:fetchTokenAllowance,
    createAllowance: createTokenAllowance
  } = useTokenAllowance()
  const {
    balance:tokenBalance,
    fetchBalance:fetchTokenBalance
  } = useGetTokenBalance()
  const params = useParams()

  const {
    bidCount,
    auction,
    highBid,
    room,
    peerCount,
    submitBid,
    submitAuction,
  } = useAuctionRoom(params.roomKey)

  const handleSubmitBid = async (value) => {
    await submitBid(value)
  }
  const handleSubmitAuction = async () => {
    await submitAuction()
  }
  const handleApproveNft = async () => {
    await createNftAllowance(auction.nft)
  }
  const handleApproveToken = async () => {
    await createTokenAllowance(auction.token)
  }

  useEffect(() => {
    if (account && auction) {
      fetchAuctioneerNftAllowance(auction.nft, auction.auctioneer)
      fetchAuctioneerNftBalance(auction.nft, auction.auctioneer, auction.nftId)
      fetchTokenAllowance(auction.token)
      fetchTokenBalance(auction.token)

    }
  }, [account])

  return (
    <Container maxW={"6xl"}>
      <BasicStatistics
        account={account}
        auctioneerNftBalance={auctioneerNftBalance}
        auctioneerNftAllowance={auctioneerNftAllowance}
        tokenBalance={tokenBalance}
        tokenAllowance={tokenAllowance}
        highBid={highBid}
        bidCount={bidCount}
        handleSubmitBid={handleSubmitBid}
        handleSubmitAuction ={handleSubmitAuction}
        handleApproveNft={handleApproveNft}
        handleApproveToken={handleApproveToken}
        auction={auction}
        peerCount={peerCount}
      />
    </Container>
  )
}
