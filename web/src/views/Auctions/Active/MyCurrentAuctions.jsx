import {
  Box,
	Accordion,
	AccordionItem,
	AccordionButton,
	AccordionPanel,
	AccordionIcon,
  Grid,
  GridItem
} from '@chakra-ui/react'

const Row =({nft, bidders, token, highestBid, deadline, status})  => {
  return (
    <Grid templateColumns='repeat(6,1fr)' gap={6}>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{nft}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{bidders}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{token}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{highestBid}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{deadline}</GridItem>
      <GridItem sx={{display:'flex', alignItems:'center'}} w='100%' h="10" >{status}</GridItem>
    </Grid>
  )
}

export const MyCurrentAuctions = () => {
	return (
		<Accordion allowToggle mb="5%">
			<AccordionItem>
				<h2>
					<AccordionButton>
						<Box as="span" flex='1' textAlign='left'>
              <Row nft={'NFT'} bidders={'bidders'} token={'Token'} highestBid={'Highest Bid'} deadline={'deadline'} status={'status'} />
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
			<AccordionItem>
				<h2>
					<AccordionButton>
						<Box as="span" flex='1' textAlign='left'>
              <Row nft={1} bidders={6} token={'0x3b2...369'} highestBid={0.1337} deadline={'2/3/2023'} />

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

			<AccordionItem>
				<h2>
					<AccordionButton>
						<Box as="span" flex='1' textAlign='left'>
							Section 2 title
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
		</Accordion>
	)

}
