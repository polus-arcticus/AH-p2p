import {
  Box,
  chakra,
  Flex,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Button,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Input
} from '@chakra-ui/react';
import { useState } from 'react';
import { BsPerson } from 'react-icons/bs';
import { FiServer, FiTrendingUp } from 'react-icons/fi';
import { RiAuctionLine } from 'react-icons/ri'
import { GoLocation } from 'react-icons/go';
import {SlPicture} from 'react-icons/sl'
import { GiToken,GiEmptyHourglass } from 'react-icons/gi'
import { VscDebugStart } from 'react-icons/vsc'
import { TbMountain } from 'react-icons/tb'
import { FaEnvelopeOpenText, FaCheck } from 'react-icons/fa'
import {substringAddr} from '@/components/Utils'
import {useTimer} from 'react-timer-hook'
import {useWeb3React} from '@web3-react/core'
function StatsCard(props) {
  const { title, stat, icon } = props;
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'5'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.800', 'gray.500')}
      rounded={'lg'}>
      <Flex justifyContent={'space-between'}>
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel
            sx={{whiteSpace: 'none'}}
            fontWeight={'medium'} isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize={'2xl'} fontWeight={'medium'}>
            {stat}
          </StatNumber>
        </Box>
        <Box
          my={'auto'}
          color={useColorModeValue('gray.800', 'gray.200')}
          alignContent={'center'}>
          {icon}
        </Box>
      </Flex>
    </Stat>
  );
}
function StatsCardBidButton({handleSubmitBid}) {
  const [bidAmount, setBidAmount] = useState(0)
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'7'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.800', 'gray.500')}
      rounded={'lg'}>
      <InputGroup>
        <InputLeftElement
          pointerEvents='none'
          color='gray.300'
          fontSize='1.2em'
          children='$'
        />
        <Input value={bidAmount} onChange={(e) => {
          setBidAmount(e.target.value)
        }} placeholder='Amount' />
        <Button
          colorScheme="teal"
          w="32.8%"
          onClick={() => {
            handleSubmitBid(bidAmount)
          }}
        >Bid</Button>
      </InputGroup>
    </Stat>
  );
}
function StatsCardConsumeAuctionButton({handleConsumeAuction}) {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'7'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.800', 'gray.500')}
      rounded={'lg'}>
      <Button
        colorScheme="teal"
        w="100%"
        variant="outline"
        onClick={() => {
          handleConsumeAuction()
        }}
      >Consume</Button>
    </Stat>
  );
}

export const  BasicStatistics = ({bidCount, highBid, auction, peerCount, handleSubmitBid}) => {
  const {account} = useWeb3React()
  const {seconds,minutes,hours,days} = useTimer({expiryTimestamp: new Date(auction.auctionData.deadline)})
  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <chakra.h1
        textAlign={'center'}
        fontSize={'4xl'}
        py={10}
        fontWeight={'bold'}>
        Auction {substringAddr(auction.auctionData.auctionSigHash)}
      </chakra.h1>
      <SimpleGrid columns={{ base: 1, sm: 1, md: 2, lg: 3 }} spacing={{ base: 5, lg: 8 }}>
        <StatsCard
          title={'Auctioneer'}
          stat={substringAddr(auction.auctionData.auctioneer)}
          icon={<RiAuctionLine size={'3em'} />}
        />
        <StatsCard
          title={'Nft'}
          stat={`${auction.auctionData.nftId}: ${substringAddr(auction.auctionData.nft)}`}
          icon={<SlPicture size={'3em'} />}
        />
        <StatsCard
          title={'Priced In'}
          stat={substringAddr(auction.auctionData.token)}
          icon={<GiToken size={'3em'} />}
        />
        <StatsCard
          title={'Starting Price'}
          stat={auction.auctionData.bidStart}
          icon={<VscDebugStart size={'3em'} />}
        />
        <StatsCard
          title={'High Bid'}
          stat={highBid}
          icon={<TbMountain size={'3em'} />}
        />
        <StatsCard
          title={'Bids'}
          stat={bidCount}
          icon={<FaEnvelopeOpenText size={'3em'} />}
        />
        <StatsCard
          title={'Deadline'}
          stat={`${days}:${hours}:${minutes}:${seconds}`}
          icon={<GiEmptyHourglass size={'3em'} />}
        />
        <StatsCard
          title={'Peers'}
          stat={peerCount}
          icon={<BsPerson size={'3em'} />}
        />
        {(auction.auctionData.auctioneer !== account) &&
            (<StatsCardBidButton
              title={'Create Bid'}
              handleSubmitBid={handleSubmitBid}
              icon={<BsPerson size={'3em'} />}
            />)
        }
        {(auction.auctionData.auctioneer == account) &&
            (<StatsCardConsumeButton />)
        }
        <StatsCardConsumeAuctionButton />
    </SimpleGrid>
    </Box>
  );
        }
