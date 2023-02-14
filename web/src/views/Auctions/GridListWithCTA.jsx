import {
	Box,
	VStack,
	Button,
	Flex,
	Divider,
	chakra,
	Grid,
	GridItem,
	Container,
} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom'
const Feature = ({ heading, text }) => {
	return (
		<GridItem>
			<chakra.h3 fontSize="xl" fontWeight="600">
				{heading}
			</chakra.h3>
			<chakra.p>{text}</chakra.p>
		</GridItem>
	);
};

export default function GridListWithCTA() {
  const navigate = useNavigate()
	return (
		<Box as={Container} maxW="7xl" mt={14} pb={16}>
			<Grid
				templateColumns={{
					base: 'repeat(1, 1fr)',
					sm: 'repeat(2, 1fr)',
					md: 'repeat(2, 1fr)',
				}}
				gap={4}>
				<GridItem colSpan={1}>
					<VStack alignItems="flex-start" spacing="20px">
						<chakra.h2 fontSize="3xl" fontWeight="700">
							Auctions Centre
						</chakra.h2>
						<Button
              colorScheme="green"
              size="md"
              onClick={() => {
              navigate('create')
              }}
            >
							Create Auction
						</Button>
					</VStack>
				</GridItem>
				<GridItem>
					<Flex>
						<chakra.p>
              Create a new Auction or browse items currently on sale
						</chakra.p>
					</Flex>
				</GridItem>
			</Grid>
			<Divider mt={12} mb={12} />
			<Grid
				templateColumns={{
					base: 'repeat(1, 1fr)',
					sm: 'repeat(2, 1fr)',
					md: 'repeat(4, 1fr)',
				}}
				gap={{ base: '8', sm: '12', md: '16' }}>
				<Feature
					heading={'Create Auction'}
					text={'Choose an Nft and a starting price in your prefered token'}
				/>
				<Feature
					heading={'Choose Connection'}
					text={'Broadcast your Auction through an open browser window, or delegate an IPFS node on your behalf so people can find it'}
				/>
				<Feature
					heading={'Sign Bids'}
					text={'Give the auction house contract permission to move your tokens if you win an auction'}
				/>
				<Feature
					heading={'Consume Auction onchain'}
					text={'Provide a stack of bids for the smart contract to parse, and have it swap the nft and tokens for you'}
				/>
			</Grid>
		</Box>
	);
}
