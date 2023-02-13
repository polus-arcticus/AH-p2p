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
  Input,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
  Text
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
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

const HoverMessage = ({
  hovered, handleClose, status, title, info, description
}) => {
  return (
    <Popover
      isOpen={hovered ? hovered: false}
      onClose={handleClose}
    >
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>{title}</PopoverHeader>
        <Text>{description}</Text>
        <PopoverBody>
          {info}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )

}
function StatsCard({
  title,
  stat,
  icon,
  status,
  infoChoices,
  description
}) {
  const [borderColour, setBorderColour] = useState('teal')
  const [showDetails, setShowDetails] = useState(false)
  const [activeInfo, setActiveInfo] = useState(null)
  const handleClose = () => {
    setShowDetails(false)
  }
  useEffect(() => {
    switch (status) {
      case 'success':
        setBorderColour('green')
        setActiveInfo(infoChoices.success)
        break
      case 'warning':
        setBorderColour('yellow')
        setActiveInfo(infoChoices.warning)
        break
      case 'error':
        setBorderColour('red')
        setActiveInfo(infoChoices.error)
        break
      default:
        setBorderColour('teal')
    }
  }, [status])
  return (<>
    <Stat
      onMouseOver={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      px={{ base: 2, md: 4 }}
      py={'5'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={borderColour}
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
      <HoverMessage
        handleClose={handleClose}
        hovered={showDetails}
        status={status}
        title={title}
        description={description}
        info={activeInfo}
      />
    </Stat>
  </>
  );
}
function StatsCardBidButton({tokenBalance, handleSubmitBid, handleSubmitAuction}) {
  const [bidAmount, setBidAmount] = useState(0)
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'7'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.800', 'gray.500')}
      rounded={'lg'}>

      <Box
        pr={1}
        pl={{ base: 2, md: 4 }}>
        <StatLabel
          sx={{whiteSpace: 'none'}}
          fontWeight={'medium'} isTruncated>
          Available: {tokenBalance}
        </StatLabel>
        <InputGroup
        >
          <InputLeftElement
            pointerEvents='none'
            color='gray.300'
            fontSize='1.2em'
            children='$'
          />
          <Input
            value={bidAmount}
            onChange={(e) => {
              setBidAmount(e.target.value)
            }}
          />
          <Button
            colorScheme="teal"
            w="32.8%"
            onClick={() => {
              handleSubmitBid(bidAmount)
            }}
          >Bid</Button>
        </InputGroup>
      </Box>
    </Stat>
  );
}
function StatsCardConsumeAuctionButton({handleConsumeAuction, handleSubmitAuction}) {
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
          handleSubmitAuction()
        }}
      >Submit Auction</Button>
    </Stat>
  );
}

function StatsCardNftAllowanceButton({handleApproveNft}) {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'7'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.800', 'gray.500')}
      rounded={'lg'}>
      <Button
        colorScheme="yellow"
        w="100%"
        variant="outline"
        onClick={() => {
          handleApproveNft()
        }}
      >Approve Nft for Auction</Button>
    </Stat>
  );
}
function StatsCardTokenAllowanceCard({handleApproveToken}) {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'7'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.800', 'gray.500')}
      rounded={'lg'}>
      <Button
        colorScheme="yellow"
        w="100%"
        variant="outline"
        onClick={() => {
          handleApproveToken()
        }}
      >Approve Token</Button>
    </Stat>
  );
}
export const  BasicStatistics = ({
  isComplete,
  account,
  bidCount,
  highBid,
  auction,
  peerCount,
  handleSubmitBid,
  handleSubmitAuction,
  handleApproveNft,
  handleApproveToken,
  auctioneerNftAllowance,
  auctioneerNftBalance,
  tokenAllowance,
  tokenBalance,
}) => {
  console.log(auctioneerNftAllowance)
  const {seconds,minutes,hours,days, restart} = useTimer({expiryTimestamp: new Date()})
  useEffect(() => {
    if (auction) {
      console.log('hmmm', auction.deadline)
      restart(new Date(auction.deadline))
    }
  }, [auction])
  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <SimpleGrid columns={{ base: 1, sm: 1, md: 2, lg: 3 }} spacing={{ base: 5, lg: 8 }}>
        <StatsCard
          title={'Auctioneer'}
          stat={auction ? substringAddr(auction.auctioneer): ''}
          icon={<RiAuctionLine size={'3em'} />}
        />
        <StatsCard
          title={'Nft'}
          stat={auction ? `${auction.nftId}: ${substringAddr(auction.nft)}` : ''}
          status={auctioneerNftBalance ? 'success': 'warning'}
          description='The address of the user who has commited to auctioning this nft'
          infoChoices={{
            success: 'The auctioneer owns the nft and has approved the auction contract',
            warning: 'The auctioneer owns the nft, but has not approved the contract',
            error: 'The auctioneer does not own this nft, beware!'
          }}
          icon={<SlPicture size={'3em'} />}
        />
        <StatsCard
          title={'Priced In'}
          stat={auction ? substringAddr(auction.token): ''}
          icon={<GiToken size={'3em'} />}
        />
        <StatsCard
          title={'Starting Price'}
          stat={auction ? auction.bidStart: ''}
          icon={<VscDebugStart size={'3em'} />}
        />
        <StatsCard
          title={'High Bid'}
          stat={highBid ? highBid: ''}
          icon={<TbMountain size={'3em'} />}
        />
        <StatsCard
          title={'Bids'}
          stat={bidCount}
          icon={<FaEnvelopeOpenText size={'3em'} />}
        />{!isComplete && (
          <StatsCard
            title={'Deadline'}
            stat={`${days}:${hours}:${minutes}:${seconds}`}
            icon={<GiEmptyHourglass size={'3em'} />}
          />)}
        {!isComplete &&
            (<StatsCard
              title={'Peers'}
              stat={peerCount}
              icon={<BsPerson size={'3em'} />}
            />)}
        { isComplete ? (<></>) : ((auction && auction.auctioneer == account) ?
          ((auctioneerNftAllowance) ?
            (<StatsCardConsumeAuctionButton
              handleSubmitAuction={handleSubmitAuction}
            />) :
            (<StatsCardNftAllowanceButton
              handleApproveNft={handleApproveNft}
            />)) :
          ((tokenAllowance > highBid) ? 
            (<StatsCardBidButton
              title={'Create Bid'}
              handleSubmitBid={handleSubmitBid}
              tokenBalance={tokenBalance}
              icon={<BsPerson size={'3em'} />} />):
            (<StatsCardTokenAllowanceCard
              handleApproveToken={handleApproveToken} />
            ))
        )
        }
      </SimpleGrid>
    </Box>
  );
}
