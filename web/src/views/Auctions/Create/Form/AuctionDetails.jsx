import {useState} from 'react'
import {useGetTokenBalance, useTokenAllowance, useFetchNftBalance, useFetchNftAllowance} from '@/hooks/useExamples'
import { useWeb3React } from '@web3-react/core'

import { Field, Form, Formik  } from 'formik';

import {
  Heading,
  Flex,
  ButtonGroup,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
} from '@chakra-ui/react'

import {SingleDatepicker} from 'chakra-dayzed-datepicker'
export const AuctionDetails = ({initialData, handleCreateAuction}) => {
  const { account } = useWeb3React()
  const {allowance:tokenAllowance, fetchAllowance:fetchAccountTokenAllowance} = useTokenAllowance()
  const {balance:tokenBalance, fetchBalance:fetchTokenBalance} = useGetTokenBalance()
  const {balances:nftBalances, fetchBalance:fetchNftBalance} = useFetchNftBalance()

  const [show, setShow] = useState(false);
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
