import { useState, useEffect } from 'react'

import { Container, useToast } from '@chakra-ui/react'

import { useIpfsAuctionsRoom } from '@/hooks/useEnglishAuction'
import { useAuctionRoom } from '@/hooks/EnglishAuction/useAuctionRoom'
import {useWeb3React} from '@web3-react/core'
import {useNft, useFetchNftBalance,useGetTokenBalance,  useFetchNftAllowance, useTokenAllowance} from '@/hooks/useExamples'

import {useParams, useNavigate} from 'react-router-dom'

import  {BasicStatistics} from './BasicStatistics'
import { Completed } from './Completed/Completed'

export const Auction = () => {
  const toast = useToast()
  const {account} = useWeb3React()
  const navigate = useNavigate()

  const { roomStatus:activeAuctionsStatus } = useIpfsAuctionsRoom()
  const {
    createAllowance: createNftAllowance
  } = useNft()

  const {
    nftAllowance:auctioneerNftAllowance,
    fetchNftAllowance:fetchAuctioneerNftAllowance
  } = useFetchNftAllowance()

  const {
    fetchNftBalance: fetchAuctioneerNftBalance,
    nftBalance: auctioneerNftBalance
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
    isComplete,
    highBid,
    room,
    peerCount,
    submitBid,
    submitAuction,
  } = useAuctionRoom({defaultRoomKey: params.roomKey})

  const handleSubmitBid = async (value) => {
    const res = await submitBid(value)
    console.log('res', res)
    if (res) {
      toast({
        status: 'success',
        title: 'Bid signed',
        description: 'Your Bid is being broadcast on the network',
        duration: 9000,
        isClosable: true
      })
    } else {
      toast({
        status: 'error',
        title: 'Bid Error',
        description: 'Not sure what happened, no bids are being broadcast',
        duration: 9000,
        isClosable: true
      })

    }

  }
  const handleSubmitAuction = async () => {
    await submitAuction()
    navigate('completed')
  }
  const handleApproveNft = async () => {
    await createNftAllowance(auction.nft)
    await fetchAuctioneerNftAllowance({nft:auction.nft, id:auction.nftId})
  }
  const handleApproveToken = async () => {
    await createTokenAllowance(auction.token)
  }

  useEffect(() => {
    if (account && auction) {
      fetchAuctioneerNftAllowance({nft:auction.nft, owner:auction.auctioneer})
      fetchAuctioneerNftBalance({nft:auction.nft, owner:auction.auctioneer, id:auction.nftId})
      fetchTokenAllowance(auction.token)
      fetchTokenBalance(auction.token)

    }
  }, [account, auction])

  return (
    <Container maxW={"6xl"}>
      <p>{activeAuctionsStatus ? 'true':'false'}</p>
      {isComplete ? (<Completed />) :
        (<BasicStatistics
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
        />)
      }
    </Container>
  )
}
