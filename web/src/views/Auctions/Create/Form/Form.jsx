import React, { useState } from 'react';
import {
  Progress,
  Box,
  Badge,
  ButtonGroup,
  Button,
  Heading,
  Flex,
  FormControl,
  GridItem,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  InputLeftAddon,
  InputGroup,
  Textarea,
  FormHelperText,
  FormErrorMessage,
  InputRightElement,
  Grid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stack,
  Image,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  useToast
} from '@chakra-ui/react';

import { Field, Form, Formik  } from 'formik';

import {useNavigate, generatePath, createSearchParams, useParams} from 'react-router-dom'

import {useGetTokenBalance, useTokenAllowance, useNft} from '@/hooks/useExamples'
import {useCreateAuction} from '@/hooks/EnglishAuction/useCreateAuction'

import {SingleDatepicker} from 'chakra-dayzed-datepicker'
import { useWeb3React } from '@web3-react/core'
import {substringAddr} from '@/components/Utils'

import {AuctionDetails} from './AuctionDetails'
import {NetworkDetails} from './NetworkDetails'
import {ConfirmDetails} from './ConfirmDetails'


export const CreateAuctionForm = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const { auctionData, connection, createAuction, defineNetwork, publishAuction } = useCreateAuction()
  const [auctionId, setAuctionId] = useState(null)
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);

  const handleCreateAuction = async (data, stepDiff, progressDiff) => {
    await createAuction(data)
    toast({
      status: 'success',
      title: 'Auction Signed',
      description: 'Auction params are signed with your ethereum private key so other users know its you',
      duration: 9000,
      isClosable: true
    })
    setStep(step+stepDiff)
    setProgress(progress+progressDiff)
  }
  const handleDefineNetwork = async (connection) => {
    defineNetwork(connection)
    setStep(step+1)
    setProgress(progress+33.33)
  }
  const handlePublish = (roomKey) => {
    publishAuction()
    toast({
      status: 'success',
      title: 'Auction Published',
      description: 'Your Auctions existence is being broadcast in the open auctions pubsub room',
      duration: 9000,
      isClosable: true
    })
    navigate(`/auctions/${roomKey}`)
  }

  const handleBack = async (auctionData, connection) => {
    setStep(step-1)
    setProgress(progress - 33.33)
  }
  return (
    <>
      <Box
        borderWidth="1px"
        rounded="lg"
        shadow="1px 1px 3px rgba(0,0,0,0.3)"
        maxW={'6xl'}
        p={6}
        m="10px auto"
      >
        <Progress
          hasStripe
          value={progress}
          mb="5%"
          mx="5%"
          isAnimated></Progress>
        {
          step === 1 ?
            <AuctionDetails initialData={auctionData} handleCreateAuction={handleCreateAuction} /> :
            step === 2 ?
              <NetworkDetails
                handleBack={handleBack}
                handleDefineNetwork={handleDefineNetwork}
                auctionData={auctionData}
                connection={connection}
              /> :
                <ConfirmDetails
                  handleBack={handleBack}
                  handlePublish={handlePublish}
                  auctionData={auctionData} 
                  connection={connection}
                />
        }
        <ButtonGroup mt="5%" w="100%">
        </ButtonGroup>
      </Box>
    </>
  );
}
