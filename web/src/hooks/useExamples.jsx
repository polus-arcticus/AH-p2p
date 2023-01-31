import { useEffect, useState, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import { getExampleToken, getExampleNft } from './utils'
import {ethers} from 'ethers'
import Static from '@/assets/Static.json'

export const useGetTokenBalance = () => {
	const [balance, setBalance] = useState("")
  const { account, provider } = useWeb3React()

	const fetchBalance = useCallback(async (address) => {
		console.log('fetching balance')
		const erc20 = getExampleToken(provider, address)
		try {
      const response = await erc20.balanceOf(account)
      setBalance(ethers.utils.parseEther(response))
    }
    catch (e) {
			console.log(e)
			setBalance('0')
		}
	}, [account])

	return {balance, fetchBalance}
}


export const useTokenAllowance = () => {
	const [allowance, setAllowance] = useState("")
	const { account, provider } = useWeb3React()

	const fetchAllowance = useCallback(async (address) => {
		const erc20 = getExampleToken(provider, address)
		const allow = await erc20.allowance(account, address)
		setAllowance(allow)
		console.log('fetch allowance')
	}, [])

  const createAllowance = useCallback(async (address, amount) => {
		const contract = getExampleToken(provider, address)
		try {
			const approve = await contract.approve(
				Static.addresses.diamond,
				ethers.utils.parseUnits(String(amount), 'ether')
			)
			return approve.status
		} catch (e) {
			console.log(e)
			return false
		}

  })

	return {allowance, fetchAllowance, createAllowance}
}

export const useNft = () => {
	const {account, provider } = useWeb3React()
  // {id:number, amount:number}
  const [balances, setBalances] = useState({})
  const [allowance, setAllowance] = useState(null)

  const fetchBalance = useCallback(async (addressNft, id) => {
		const contract = getExampleNft(provider, addressNft)
    try {
      const response = await contract.balanceOf(account, id)
      console.log(ethers.utils)
      balances[id] = ethers.utils.formatUnits(response, 0)
      setBalances(balances)
    } catch (e) {
			console.log(e)
			return false
    }
  },[account, provider])

  const fetchAllowance = useCallback(async (auctioneer) => {
		const contract = getExampleNft(provider, address)
    try {
      const response = await contract.isApprovedForAll(auctioneer, contract.address)
      setAllowance(response)
    } catch (e) {
      console.log(e)
      return false
    }
  }, [])
  const createAllowance = useCallback(async (auctioneer, address) => {
		const contract = getExampleNft(provider, address)
    try {
      const response = await contract.setApprovalForAll(contract.address, auctioneer)
      setAllowance(response)
    } catch (e) {
      console.log(e)
      return false
    }
  }, [])


  const createSafeTransferFrom = useCallback(async (auctioneer, bidder, id, amount, data) => {
		const contract = getExampleNft(provider, address)

    try {
      const response = await contract.safeTransferFrom(auctioneer, bidder, id, amount, data )
    } catch (e) {
      console.log(e)
      return false
    }
  }, [])

  return { 
    fetchAllowance,
    createAllowance,
    allowance,
    fetchBalance,
    balances,
    createSafeTransferFrom
    
  }
}
