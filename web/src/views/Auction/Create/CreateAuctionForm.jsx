import React, { useState } from 'react';
import {
  Progress,
  Box,
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
} from '@chakra-ui/react';

import { useToast } from '@chakra-ui/react';
import { Field, Form, Formik  } from 'formik';

import {useGetTokenBalance, useTokenAllowance, useNft} from '@/hooks/useExamples'
import {useCreateAuction} from '@/hooks/useEnglishAuction'

import {SingleDatepicker} from 'chakra-dayzed-datepicker'
import { useWeb3React } from '@web3-react/core'

const Form1 = ({handleCreateAuction}) => {
  const { account } = useWeb3React()
  const {allowance:tokenAllowance, fetchAllowance:fetchTokenAllowance} = useTokenAllowance()
  const {balance:tokenBalance, fetchBalance:fetchTokenBalance} = useGetTokenBalance()
  const {balances:nftBalances, fetchBalance:fetchNftBalance} = useNft()

  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  const validateNftId = (value) => {
    let error
    if (!value) {error = 'cannot auction thin air'}
    return error
  }
  const validateNftAddress =  async (value) => {
    let error
    if (!value) {error = 'please enter an  ethereum address'}
    // check for validness of address
    // check for nftness of address
    return error
  }
  const validateStartPrice = (value) => {
    let error
    if (!value) {error = 'please enter a start price'}
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
  const [nftConfirmed, setNftConfirmed] = useState(false)
  const [tokenConfirmed, setTokenConfirmed] = useState(false)
  const [date, setDate] = useState(new Date());

  return (
    <Formik
      validate={async (values) => {
        const errors = {};

        if (values.nftId && values.nftAddress && !nftConfirmed) {
          try {
            const res = await fetchNftBalance(values.nftAddress, values.nftId)
            console.log(nftBalances)
            if (nftBalances[values.nftId] > 0) {
              setNftConfirmed(true)
            } else {
              setNftConfirmed(false)
              errors.nftId  = 'Nft id not owned by this account at given address'
              errors.nftAddress  = 'address may not be an nft contract'

            }
          } catch (e) {
            console.log(e)
            return
          }
        }

        if (values.tokenAddress && values.startPrice && !tokenConfirmed) {
          try {
            const res = await fetchTokenBalance(values.tokenAddress)
              if (tokenBalance >= 0) {
                setTokenConfirmed(true)
              } else {
                setTokenConfirmed(false)
                errors.tokenAddress = 'Address doesnt seem to be a erc20 contract'
              }
          } catch (e) {
            console.log(e)
            return 
          }
        }
        return errors
      }}
      initialValues={{
        nftId: '',
        nftAddress: '',
        startPrice: '',
        tokenAddress: '',
        deadline: new Date(),
        signWith: ''
      }}
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
            <Field name="nftAddress" validate={validateNftAddress}>
              {({field, form}) => (

                <FormControl isInvalid={form.errors.nftAddress} mr="5%">
                  <FormLabel fontWeight={'normal'}>
                    Nft Address
                  </FormLabel>
                  <Input {...field} placeholder="Nft Address" />
                  <FormErrorMessage>{form.errors.nftAddress}</FormErrorMessage>
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
            <Field name="tokenAddress" validate={validateTokenAddress}>
              {({field, form}) => (
                <FormControl isInvalid={form.errors.tokenAddress} mr="5%">
                  <FormLabel fontWeight={'normal'}>
                    Token Address
                  </FormLabel>
                  <Input {...field} placeholder="Token Address" />
                  <FormErrorMessage>{form.errors.tokenAddress}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="startPrice" validate={validateStartPrice}>
              {({field, form}) => (
                <FormControl isInvalid={form.errors.startPrice} mr="5%">
                  <FormLabel fontWeight={'normal'}>
                    Start Price
                  </FormLabel>
                  <Input {...field} placeholder="Start Price" />
                  <FormErrorMessage>{form.errors.startPrice}</FormErrorMessage>
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
            <Field name="signWith" validate={validateSignWith}>
              {({field, form}) => (
                <FormControl isInvalid={form.errors.signWith} mr="5%">
                  <FormLabel fontWeight={'normal'}>Sign With</FormLabel>
                  <Input {...field} placeholder="Sign With" />
                  <FormErrorMessage>{form.errors.signWith}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </Flex>

          <ButtonGroup mt="5%" w="100%">
            <Flex w="100%" justifyContent="space-between">
              <Flex>
                <Button
                  isDisabled={true}
                  colorScheme="teal"
                  variant="solid"
                  w="7rem"
                  mr="5%">
                  Back
                </Button>
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

const Form2 = () => {
  return (
    <>
      <Heading w="100%" textAlign={'center'} fontWeight="normal" mb="2%">
        Confirm
      </Heading>
      <FormControl as={GridItem} colSpan={[6, 3]}>
        <FormLabel
          htmlFor="country"
          fontSize="sm"
          fontWeight="md"
          color="gray.700"
          _dark={{
            color: 'gray.50',
          }}>
          Country / Region
        </FormLabel>
        <Select
          id="country"
          name="country"
          autoComplete="country"
          placeholder="Select option"
          focusBorderColor="brand.400"
          shadow="sm"
          size="sm"
          w="full"
          rounded="md">
          <option>United States</option>
          <option>Canada</option>
          <option>Mexico</option>
        </Select>
      </FormControl>

      <FormControl as={GridItem} colSpan={6}>
        <FormLabel
          htmlFor="street_address"
          fontSize="sm"
          fontWeight="md"
          color="gray.700"
          _dark={{
            color: 'gray.50',
          }}
          mt="2%">
          Street address
        </FormLabel>
        <Input
          type="text"
          name="street_address"
          id="street_address"
          autoComplete="street-address"
          focusBorderColor="brand.400"
          shadow="sm"
          size="sm"
          w="full"
          rounded="md"
        />
      </FormControl>

      <FormControl as={GridItem} colSpan={[6, 6, null, 2]}>
        <FormLabel
          htmlFor="city"
          fontSize="sm"
          fontWeight="md"
          color="gray.700"
          _dark={{
            color: 'gray.50',
          }}
          mt="2%">
          City
        </FormLabel>
        <Input
          type="text"
          name="city"
          id="city"
          autoComplete="city"
          focusBorderColor="brand.400"
          shadow="sm"
          size="sm"
          w="full"
          rounded="md"
        />
      </FormControl>

      <FormControl as={GridItem} colSpan={[6, 3, null, 2]}>
        <FormLabel
          htmlFor="state"
          fontSize="sm"
          fontWeight="md"
          color="gray.700"
          _dark={{
            color: 'gray.50',
          }}
          mt="2%">
          State / Province
        </FormLabel>
        <Input
          type="text"
          name="state"
          id="state"
          autoComplete="state"
          focusBorderColor="brand.400"
          shadow="sm"
          size="sm"
          w="full"
          rounded="md"
        />
      </FormControl>

      <FormControl as={GridItem} colSpan={[6, 3, null, 2]}>
        <FormLabel
          htmlFor="postal_code"
          fontSize="sm"
          fontWeight="md"
          color="gray.700"
          _dark={{
            color: 'gray.50',
          }}
          mt="2%">
          ZIP / Postal
        </FormLabel>
        <Input
          type="text"
          name="postal_code"
          id="postal_code"
          autoComplete="postal-code"
          focusBorderColor="brand.400"
          shadow="sm"
          size="sm"
          w="full"
          rounded="md"
        />
      </FormControl>
    </>
  );
};

const Form3 = () => {
  return (
    <>
      <Heading w="100%" textAlign={'center'} fontWeight="normal">
        Publish
      </Heading>
      <SimpleGrid columns={1} spacing={6}>
        <FormControl as={GridItem} colSpan={[3, 2]}>
          <FormLabel
            fontSize="sm"
            fontWeight="md"
            color="gray.700"
            _dark={{
              color: 'gray.50',
            }}>
            Website
          </FormLabel>
          <InputGroup size="sm">
            <InputLeftAddon
              bg="gray.50"
              _dark={{
                bg: 'gray.800',
              }}
              color="gray.500"
              rounded="md">
              http://
            </InputLeftAddon>
            <Input
              type="tel"
              placeholder="www.example.com"
              focusBorderColor="brand.400"
              rounded="md"
            />
          </InputGroup>
        </FormControl>

        <FormControl id="email" mt={1}>
          <FormLabel
            fontSize="sm"
            fontWeight="md"
            color="gray.700"
            _dark={{
              color: 'gray.50',
            }}>
            About
          </FormLabel>
          <Textarea
            placeholder="you@example.com"
            rows={3}
            shadow="sm"
            focusBorderColor="brand.400"
            fontSize={{
              sm: 'sm',
            }}
          />
          <FormHelperText>
            Brief description for your profile. URLs are hyperlinked.
          </FormHelperText>
        </FormControl>
      </SimpleGrid>
    </>
  );
};

export const CreateAuctionForm = () => {
  const { auctionData, createAuction } = useCreateAuction()
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(33.33);
  const handleCreateAuction = async (data, stepDiff, progressDiff) => {
    await createAuction(data)
    setStep(step+stepDiff)
    setProgress(progress+progressDiff)
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
        {step === 1 ? <Form1 handleCreateAuction={handleCreateAuction} /> : step === 2 ? <Form2 /> : <Form3 />}
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
