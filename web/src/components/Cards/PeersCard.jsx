import { useState, useEffect } from 'react'

import {
  Stat,
  Flex,
  Box,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Tag,
  TagLabel,
  TagLeftIcon,
  TagRightIcon,
  TagCloseButton,
  Avatar,
} from '@chakra-ui/react'

import { BsPerson } from 'react-icons/bs';
import { HoverMessage } from '@/components/HoverMessage'

export const PeersCard = ({
  size,
  stat,
  status,
  peerCount
}) => {
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
        setActiveInfo('You are Connected to the Auction Discovery Room')
        break
      case 'warning':
        setBorderColour('yellow')
        setActiveInfo('Attempting to Connect to the Auction Discovery Room')
        break
      case 'error':
        setBorderColour('red')
        setActiveInfo('Could not Connect to Auction Discovery Room')
        break
      default:
        setBorderColour('teal')
    }
  }, [status])
  return (<>
    { size == 0 &&(
			<Tag
        border={'1px solid'}
        borderColor={borderColour}
        onMouseOver={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        size='lg' colorScheme='red' borderRadius='full'>
        <TagLeftIcon color={borderColour} as={BsPerson} ></TagLeftIcon>
				<TagLabel color={borderColour}>Peers</TagLabel>
				<TagLabel
          borderRadius="16px"
          border="1px solid black"
          px="8px"
          ml="8px"
        color={borderColour}>{peerCount}</TagLabel>
			</Tag>
    )}
    {size == 1 && (
      <Stat
        px={{ base: 2, md: 4 }}
        py={'5'}
        shadow={'xl'}
        border={'1px solid'}
        borderColor={borderColour}
        onMouseOver={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        rounded={'lg'}
      >
        <Flex justifyContent={'space-between'}>
          <Box pl={{ base: 2, md: 4 }}>
            <StatLabel
              sx={{whiteSpace: 'none'}}
              fontWeight={'medium'} isTruncated>
              Peers
            </StatLabel>
            <StatNumber fontSize={'2xl'} fontWeight={'medium'}>
              {peerCount}
            </StatNumber>
          </Box>
          <Box
            my={'auto'}
            color={useColorModeValue('gray.800', 'gray.200')}
            alignContent={'center'}>
              <BsPerson size={'3em'} />
          </Box>
        </Flex>
      </Stat>
    )}
        <HoverMessage
          handleClose={handleClose}
          hovered={showDetails}
          status={status}
          title={'Peers'}
          description={'Number of Peers in the auction discovery room'}
          info={activeInfo}
        />
  </>)
}
