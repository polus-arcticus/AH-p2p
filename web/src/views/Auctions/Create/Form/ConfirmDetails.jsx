import {useState} from 'react'
import { useWeb3React } from '@web3-react/core'

import {substringAddr} from '@/components/Utils'
import {
  Box,
  Heading,
  Flex,
  ButtonGroup,
  Button,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react'
export const ConfirmDetails = ({auctionData, handlePublish, connection, handleBack}) => {
  return (
        <Box>
          <Heading w="100%" textAlign={'center'} fontWeight="normal" mb="2%">
            Publish
          </Heading>
          <StatGroup>
            <Stat>
              <StatLabel>Auctioneer Address</StatLabel>
              <StatNumber>{substringAddr(auctionData.auctioneer)}</StatNumber>
              <StatHelpText>Address of Nft owner</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Deadline</StatLabel>
              <StatNumber>{Math.floor(auctionData.deadline.getTime() / 1000)}</StatNumber>
              <StatHelpText>Point when bidding is disabled</StatHelpText>
            </Stat>
          </StatGroup>
          <StatGroup>
            <Stat>
              <StatLabel>NFT collection</StatLabel>
              <StatNumber>{substringAddr(auctionData.nft)}</StatNumber>
              <StatHelpText>nft collection address</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>NFT</StatLabel>
              <StatNumber>{auctionData.nftId}</StatNumber>
              <StatHelpText>id of nft being auctioned</StatHelpText>
            </Stat>
          </StatGroup>
          <StatGroup>
            <Stat>
              <StatLabel>Token</StatLabel>
              <StatNumber>{substringAddr(auctionData.token)}</StatNumber>
              <StatHelpText>denomination of auction</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Start Price</StatLabel>
              <StatNumber>{auctionData.bidStart}</StatNumber>
              <StatHelpText>Being auctioning at this price</StatHelpText>
            </Stat>
          </StatGroup>
          <StatGroup>
            <Stat>
              <StatLabel>Connection</StatLabel>
              <StatNumber>{connection.connection}</StatNumber>
              <StatHelpText>Which protocol and storage paradigm one is using</StatHelpText>
            </Stat>
          </StatGroup>
          <ButtonGroup mt="5%" w="100%">
            <Flex>
                <Button
                  colorScheme="teal"
                  variant="outline"
                  onClick={handleBack}
                  w="7rem"
                  mr="5%">
                  Back
                </Button>
              <Button
                w="7rem"
                colorScheme="teal"
                onClick={() => handlePublish(auctionData.auctionSigHash)}
              >
                Publish
              </Button>
            </Flex>
          </ButtonGroup>
        </Box>
  );
};
