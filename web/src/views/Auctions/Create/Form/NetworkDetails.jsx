
import {useState} from 'react'
import {useGetTokenBalance, useTokenAllowance, useNft} from '@/hooks/useExamples'
import { useWeb3React } from '@web3-react/core'

import { Field, Form, Formik  } from 'formik';

import {substringAddr} from '@/components/Utils'
import {
  Heading,
  Flex,
  ButtonGroup,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  GridItem,
  Select
} from '@chakra-ui/react'
export const NetworkDetails = ({auctionData, networkParams, handleDefineNetwork, handleBack}) => {
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
