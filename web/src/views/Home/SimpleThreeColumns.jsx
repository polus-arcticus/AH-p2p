import { ReactElement } from 'react';
import {Container, Box, SimpleGrid, Icon, Text, Stack, Flex } from '@chakra-ui/react';
import { FcAssistant, FcDonate, FcInTransit } from 'react-icons/fc';


const Feature = ({ title, text, icon }) => {
	return (
		<Stack>
			<Flex
				w={16}
				h={16}
				align={'center'}
				justify={'center'}
				color={'white'}
				rounded={'full'}
				bg={'gray.100'}
				mb={1}>
				{icon}
			</Flex>
			<Text fontWeight={600}>{title}</Text>
			<Text color={'gray.600'}>{text}</Text>
		</Stack>
	);
};

export default function SimpleThreeColumns() {
	return (

    <Container maxW={'6xl'}>
		<Box py={16}>
			<SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
				<Feature
					icon={<Icon as={FcAssistant} w={10} h={10} />}
					title={'Realtime p2p'}
					text={
						'Find auctions and connect with bidders in real time without centralized infrastructure or profiteers.'
					}
				/>
				<Feature
					icon={<Icon as={FcDonate} w={10} h={10} />}
					title={'Producer Pays'}
					text={
						'AH-p2p burdens the auctioneer with gas costs, not both buyerand seller'
					}
				/>
				<Feature
					icon={<Icon as={FcInTransit} w={10} h={10} />}
					title={'Cryptographic Permit Chaining'}
					text={
						'EIP-712 Permits ensure that auctions and bids are done by their owners at specific quantities'
					}
				/>
			</SimpleGrid>
		</Box>
    </Container>
	);
}
