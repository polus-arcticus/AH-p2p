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
    const res = await submitAuction()
    console.log('submit auction res', res)
    if (res) {
      toast({
        status: 'success',
        title: 'Auction Cleared!',
        description: 'The auctioneer managed a price for your Nft',
        duration: 9000,
        isClosable: true
      })
    } else {
      toast({
        status: 'error',
        title: 'Auction Consumption Error',
        description: 'Not sure what happened',
        duration: 9000,
        isClosable: true
      })

    }
    //navigate('completed')
  }
  const handleApproveNft = async () => {
    await createNftAllowance(auction.nft)
    const res = await fetchAuctioneerNftAllowance({nft:auction.nft, id:auction.nftId})
    if (res) {
      toast({
        status: 'success',
        title: 'Auction Contract Nft Approval',
        description: 'You have successfully approved the auction house contract for moving your nft',
        duration: 9000,
        isClosable: true
      })
    } else {
      toast({
        status: 'error',
        title: 'Nft Approval Error',
        description: 'Not sure what happened',
        duration: 9000,
        isClosable: true
      })

    }

  }
  const handleApproveToken = async () => {
    const res = await createTokenAllowance(auction.token)
    if (res) {
      toast({
        status: 'success',
        title: 'Auction Contract Token Approval',
        description: 'You have successfully approved the auction house contract for moving your tokens if you win the auction',
        duration: 9000,
        isClosable: true
      })
    } else {
      toast({
        status: 'error',
        title: 'Token Approval Error',
        description: 'Not sure what happened',
        duration: 9000,
        isClosable: true
      })

    }
  }

  useEffect(() => {
    if (account && auction) {
      fetchAuctioneerNftAllowance({nft:auction.nft, owner:auction.auctioneer})
      fetchAuctioneerNftBalance({nft:auction.nft, owner:auction.auctioneer, id:auction.nftId})
      fetchTokenAllowance(auction.token)
      fetchTokenBalance(auction.token)

    }
  }, [account, auction])

  useEffect(() => {
    console.log('iscomplete trigger')
    if (isComplete) {
      toast({
        status: 'success',
        title: 'Auction Completed',
        description: 'This auction is over',
        duration: 9000,
        isClosable: true
      })
    } else {

    }
  }, [isComplete])

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
