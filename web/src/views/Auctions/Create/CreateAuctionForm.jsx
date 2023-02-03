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
  StatGroup
} from '@chakra-ui/react';

import { useToast } from '@chakra-ui/react';
import { Field, Form, Formik  } from 'formik';

import {useNavigate, generatePath, createSearchParams, useParams} from 'react-router-dom'

import {useGetTokenBalance, useTokenAllowance, useNft} from '@/hooks/useExamples'
import {useCreateAuction} from '@/hooks/useEnglishAuction'

import {SingleDatepicker} from 'chakra-dayzed-datepicker'
import { useWeb3React } from '@web3-react/core'
import {substringAddr} from '@/components/Utils'

const Form1 = ({initialData, handleCreateAuction}) => {
  const { account } = useWeb3React()
  const {allowance:tokenAllowance, fetchAllowance:fetchTokenAllowance} = useTokenAllowance()
  const {balance:tokenBalance, fetchBalance:fetchTokenBalance} = useGetTokenBalance()
  const {balances:nftBalances, fetchBalance:fetchNftBalance} = useNft()


  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  const [nftConfirmed, setNftConfirmed] = useState(false)
  const [tokenConfirmed, setTokenConfirmed] = useState(false)

  const [date, setDate] = useState(new Date());
  const validateNftId = (value) => {
    let error
    if (value.length == 0) {error = 'cannot auction thin air'}
    return error
  }
  const validateNft =  async (value) => {
    let error
    if (!value) {error = 'please enter an  ethereum address'}
    // check for validness of address
    // check for nftness of address
    return error
  }
  const validateBidStart = (value) => {
    let error
    if (value.length == 0) {error = 'please enter a start price'}
    return error
  }
  const validateTokenAddress =(value) => {
    let error
    if (!value) {error = 'please enter a token to denominate the auction with'}
    // check for validness of address
    // check for erc20'ness of address
    return error
  }
  const validateDeadline = (value) => {
    let error
    if (!value) {error = 'please enter in a time when the auction ceases'}
    // check for time in future
    return error
  }
  const validateSignWith = (value) => {
    let error
    if (!value) {error = "please enter the address you wish to sign with"}
    // check that user is owner of said public address
    return error
  }

  return (
    <Formik
      validate={async (values) => {
        const errors = {};

        if (values.nftId && values.nft && !nftConfirmed) {
          try {
            const res = await fetchNftBalance(values.nft, values.nftId)
            console.log(nftBalances)
            if (nftBalances[values.nftId] > 0) {
              setNftConfirmed(true)
            } else {
              setNftConfirmed(false)
              errors.nftId  = 'Nft id not owned by this account at given address'
              errors.nft  = 'address may not be an nft contract'

            }
          } catch (e) {
            console.log(e)
            return
          }
        }

        if (values.token && values.bidStart && !tokenConfirmed) {
          try {
            const res = await fetchTokenBalance(values.token)
            if (tokenBalance >= 0) {
              setTokenConfirmed(true)
            } else {
              setTokenConfirmed(false)
              errors.token = 'Address doesnt seem to be a erc20 contract'
            }
          } catch (e) {
            console.log(e)
            return 
          }
        }
        return errors
      }}
      initialValues={initialData}
      onSubmit={async(values, actions) => {
        handleCreateAuction(values, 1, 33.33)
      }}
    >
      {(props) => (
        <Form>
          <Heading w="100%" textAlign={'center'} fontWeight="normal" mb="2%">
            Parameters
          </Heading>
          <Flex>
            <Field name="nft" validate={validateNft}>
              {({field, form}) => (

                <FormControl isInvalid={form.errors.nft} mr="5%">
                  <FormLabel fontWeight={'normal'}>
                    Nft Address
                  </FormLabel>
                  <Input {...field} placeholder="Nft Address" />
                  <FormErrorMessage>{form.errors.nft}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="nftId" validate={validateNftId}>
              {({field, form}) => (

                <FormControl isInvalid={form.errors.nftId} mr="5%">
                  <FormLabel fontWeight={'normal'}>
                    NftId
                  </FormLabel>
                  <Input {...field} placeholder="Nft Id" />
                  <FormErrorMessage>{form.errors.nftId}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </Flex>
          <Flex>
            <Field name="token" validate={validateTokenAddress}>
              {({field, form}) => (
                <FormControl isInvalid={form.errors.token} mr="5%">
                  <FormLabel fontWeight={'normal'}>
                    Token Address
                  </FormLabel>
                  <Input {...field} placeholder="Token Address" />
                  <FormErrorMessage>{form.errors.token}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="bidStart" validate={validateBidStart}>
              {({field, form}) => (
                <FormControl isInvalid={form.errors.bidStart} mr="5%">
                  <FormLabel fontWeight={'normal'}>
                    Bid Start
                  </FormLabel>
                  <Input {...field} placeholder="Bid Start" />
                  <FormErrorMessage>{form.errors.bidStart}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </Flex>
          <Flex>
            <Field name="deadline" id={"deadline"} validate={validateDeadline}>
              {({field: {value}, form: {errors, setFieldValue}}) => (
                <FormControl isInvalid={errors.deadline} mr="5%">
                  <FormLabel fontWeight={'normal'}>Deadline</FormLabel>
                  <SingleDatepicker
                    name="deadline"
                    date={value}
                    onDateChange={(date) => setFieldValue("deadline", date) }
                  />
                  <FormErrorMessage>{errors.deadline}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="auctioneer" validate={validateSignWith}>
              {({field, form}) => (
                <FormControl isInvalid={form.errors.auctioneer} mr="5%">
                  <FormLabel fontWeight={'normal'}>Sign With</FormLabel>
                  <Input {...field} placeholder="Sign With" />
                  <FormErrorMessage>{form.errors.auctioneer}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </Flex>

          <ButtonGroup mt="5%" w="100%">
            <Flex w="100%" justifyContent="space-between">
              <Flex>
                <Button
                  w="7rem"
                  colorScheme="teal"
                  variant="outline"
                  isDisabled={props.isValid === false}
                  onClick={() => {
                  }}
                  isLoading={props.isSubmitting}
                  type="submit"
                >
                  Next
                </Button>
              </Flex>
            </Flex>

          </ButtonGroup>
        </Form>
      )}
    </Formik>
  );
};

const Form2 = ({auctionData, networkParams, handleDefineNetwork, handleBack}) => {
  return (
    <Formik
      onSubmit={async (data) => {
        handleDefineNetwork(data.host, data.storage)
        console.log(auctionData)
      }}
      initialValues={networkParams}
    >
      {(props) => (
        <Form>
          <Heading w="100%" textAlign={'center'} fontWeight="normal" mb="2%">
            Confirm
          </Heading>
          <StatGroup>
            <Stat>
              <StatLabel>Auctioneer Address</StatLabel>
              <StatNumber>{substringAddr(auctionData.auctioneer)}</StatNumber>
              <StatHelpText>Address of Nft owner</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Deadline</StatLabel>
              <StatNumber>{Math.floor(auctionData.deadline.getTime() /1000)}</StatNumber>
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
          <Flex>
            <Field name="storage">
              {({field, form}) => (
                <FormControl as={GridItem} colSpan={[6, 3]}>
                  <FormLabel
                    htmlFor="storage"
                    fontSize="sm"
                    fontWeight="md"
                    color="gray.700"
                    _dark={{
                      color: 'gray.50',
                    }}>
                    Storage Choice
                  </FormLabel>
                  <Select
                    {...field}
                    id="storage"
                    name="storage"
                    autoComplete="storage"
                    placeholder="Select Choice"
                    focusBorderColor="brand.400"
                    shadow="sm"
                    size="sm"
                    w="full"
                    rounded="md">
                    <option value="localstorage">LocalStorage</option>
                    <option value="orbit-db">IPFS Pin</option>
                    <option value="fleek">Fleek</option>
                    <option value="jsonExport">Export to JSON</option>
                  </Select>

                  <FormErrorMessage>{form.errors.storage}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </Flex>
          <Flex>
            <Field name="host">
              {({field, form}) => (
                <FormControl as={GridItem} colSpan={[6, 3]}>
                  <FormLabel
                    htmlFor="host"
                    fontSize="sm"
                    fontWeight="md"
                    color="gray.700"
                    _dark={{
                      color: 'gray.50',
                    }}>
                    Choose Hosting Method
                  </FormLabel>
                  <Select
                    {...field}
                    id="host"
                    name="host"
                    autoComplete="host"
                    placeholder="Select option"
                    focusBorderColor="brand.400"
                    shadow="sm"
                    size="sm"
                    w="full"
                    rounded="md">
                    <option value="ipfsPubsub">IPFS Pubsub</option>
                    <option value="pinToOrbit-db">Pin with Orbit-db</option>
                    <option value="selfHost">I want to host it myself</option>
                  </Select>
                  <FormErrorMessage>{form.errors.host}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </Flex>
          <ButtonGroup mt="5%" w="100%">
            <Flex>
              <Button
                isDisabled={false}
                colorScheme="teal"
                variant="outline"
                w="7rem"
                onClick={handleBack}
                mr="5%">
                Back
              </Button>
              <Button
                w="7rem"
                colorScheme="teal"
                isDisabled={props.isValid === false}
                onClick={() => {
                }}
                isLoading={props.isSubmitting}
                type="submit"
              >
                Next
              </Button>
            </Flex>
          </ButtonGroup>
        </Form>
      )}
    </Formik>
  );
};

const Form3 = ({auctionData, handlePublish, networkParams, handleBack}) => {
  console.log(auctionData)
  console.log(networkParams)
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
              <StatLabel>Host</StatLabel>
              <StatNumber>{networkParams.host}</StatNumber>
              <StatHelpText>method to host auction from</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Storage</StatLabel>
              <StatNumber>{networkParams.storage}</StatNumber>
              <StatHelpText>where the permit message is</StatHelpText>
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

export const CreateAuctionForm = () => {
  const navigate = useNavigate()
  const { auctionData, networkParams, createAuction, defineNetwork, publishAuction } = useCreateAuction()
  const [auctionId, setAuctionId] = useState(null)
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);

  const handleCreateAuction = async (data, stepDiff, progressDiff) => {
    await createAuction(data)
    setStep(step+stepDiff)
    setProgress(progress+progressDiff)
  }
  const handleDefineNetwork = async (host, storage) => {
    defineNetwork(host, storage)
    setStep(step+1)
    setProgress(progress+33.33)
  }
  const handlePublish = (roomKey) => {
    publishAuction()
    navigate(`/auctions/${roomKey}`)
  }

  const handleBack = async (auctionData, networkParams) => {
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
            <Form1 initialData={auctionData} handleCreateAuction={handleCreateAuction} /> :
            step === 2 ?
              <Form2
                handleBack={handleBack}
                handleDefineNetwork={handleDefineNetwork}
                auctionData={auctionData}
                networkParams={networkParams}
              /> :
                <Form3
                  handleBack={handleBack}
                  handlePublish={handlePublish}
                  auctionData={auctionData} 
                  networkParams={networkParams}
                />
        }
        <ButtonGroup mt="5%" w="100%">
          {/*
          <Flex w="100%" justifyContent="space-between">
            <Flex>
              <Button
                onClick={() => {
                  setStep(step - 1);
                  setProgress(progress - 33.33);
                }}
                isDisabled={step === 1}
                colorScheme="teal"
                variant="solid"
                w="7rem"
                mr="5%">
                Back
              </Button>
              <Button
                w="7rem"
                isDisabled={step === 3}
                onClick={() => {
                  setStep(step + 1);
                  if (step === 3) {
                    setProgress(100);
                  } else {
                    setProgress(progress + 33.33);
                  }
                }}
                colorScheme="teal"
                variant="outline">
                Next
              </Button>
            </Flex>
            {step === 3 ? (
              <Button
                w="7rem"
                colorScheme="red"
                variant="solid"
                onClick={() => {
                  toast({
                    title: 'Account created.',
                    description: "We've created your account for you.",
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                }}>
                Submit
              </Button>
            ) : null}
          </Flex>
          */}
        </ButtonGroup>
      </Box>
    </>
  );
}
