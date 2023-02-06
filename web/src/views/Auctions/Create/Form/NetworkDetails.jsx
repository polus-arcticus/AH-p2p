
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
export const NetworkDetails = ({auctionData, connection, handleDefineNetwork, handleBack}) => {

  return (
    <Formik
      onSubmit={async (data) => {
        handleDefineNetwork(data.connection)
      }}
      initialValues={connection}
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
            <Field name="connection">
              {({field, form}) => (
                <FormControl as={GridItem} colSpan={[6, 3]}>
                  <FormLabel
                    htmlFor="connection"
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
                    id="connection"
                    name="connection"
                    autoComplete="connection"
                    placeholder="Select Choice"
                    focusBorderColor="brand.400"
                    shadow="sm"
                    size="sm"
                    w="full"
                    rounded="md">
                    <option value="localstorage">Ipfs Pubsub + Localstorage</option>
                    <option value="orbit-db">Ipfs Pubsub + Orbit Db</option>
                    <option value="gun-js">Gunjs</option>
                    <option value="fleek">Fleek</option>
                    <option value="jsonExport">Export to JSON</option>
                  </Select>

                  <FormErrorMessage>{form.errors.connection}</FormErrorMessage>
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
