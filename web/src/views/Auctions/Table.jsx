import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Grid,
  GridItem,
  Button
} from '@chakra-ui/react'
import {useState, useEffect} from 'react'
import { substringAddr } from '@/components/Utils'
import { useNavigate } from 'react-router-dom'

const Row =({auctioneer, nft, bidders, token, highestBid, deadline})  => {
  return (
    <Grid templateColumns='1fr 1fr 0.5fr 1fr 0.5fr 1fr' gap={6}>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{auctioneer}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{nft}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{bidders}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{token}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{highestBid}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{deadline}</GridItem>
    </Grid>
  )
}
const AuctionItem = ({auction}) => {
  const navigate =useNavigate()
  console.log(auction)
  const highestBid = (auction.bids.length > 0) ? Math.max(...auction.bids.map((bid) => bid.amount)): auction.bidStart
  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box as="span" flex='1' textAlign='left'>
            <Row
              auctioneer={substringAddr(auction.auctioneer)}
              nft={`${auction.nftId}: ${substringAddr(auction.nft)}`}
              bidders={auction.bids.length}
              token={substringAddr(auction.token)}
              highestBid={highestBid} 
              deadline={auction.deadline}
            />

          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4}>
        <Button
          colorScheme="red"
          onClick={() => {
            navigate(`/auctions/${auction.auctionSigHash}`)
          }}>Go To Bidding Room</Button>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </AccordionPanel>
    </AccordionItem>

  )
}

export const Table = ({auctions}) => {
  const [auctionItems, setAuctionItems] =useState(<></>)
  useEffect(() => {
    if (auctions.length > 0) {
      console.log('table::auctions', auctions)
  setAuctionItems(auctions.map((auction,i) => {
    console.log('table::auction.completed',auction.completed)
    return (<AuctionItem key={i} auction={auction.auctionData}/>)
  }))

    }
  }, [auctions])
  return (
    <Accordion allowToggle mb="5%">
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex='1' textAlign='left'>
              <Row auctioneer={'Auctioneer'} nft={'NFT'} bidders={'Bidders'} token={'Token'} highestBid={'Highest Bid'} deadline={'Deadline'} />
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
          veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
          commodo consequat.
        </AccordionPanel>
      </AccordionItem>
      {auctionItems}
    </Accordion>
  )

}
