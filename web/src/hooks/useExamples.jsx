import { useEffect, useState, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import { getExampleToken, getExampleNft } from './utils'
import {ethers} from 'ethers'
import Static from '@/assets/Static.json'


export const useGetTokenBalance = (defaultToken=null) => {
	const [balance, setBalance] = useState("")
  const { account, provider } = useWeb3React()

	const fetchBalance = useCallback(async (token=defaultToken,address=account) => {
		const erc20 = getExampleToken(provider, token)
		try {
      const response = await erc20.balanceOf(address)
      console.log('fetching balance: ',response)
      setBalance(ethers.utils.formatEther(response))
    }
    catch (e) {
			console.log(e)
			setBalance('0')
		}
	}, [account, provider])

	return {balance, fetchBalance}
}

export const useTokenAllowance = () => {
	const [allowance, setAllowance] = useState("")
	const { account, provider } = useWeb3React()

	const fetchAllowance = useCallback(async (address) => {
		console.log('fetching token allowance')
		const erc20 = getExampleToken(provider, address)
		const allow = await erc20.allowance(account, Static.englishAuctionAddr)
		console.log(' token allowance', ethers.utils.formatUnits(allow, 0))
		setAllowance(Number( ethers.utils.formatUnits(allow,18) ))
	}, [account, provider])

  const createAllowance = useCallback(async (address) => {
    const signer = provider.getSigner()
		const contract = getExampleToken(signer, address)
		try {
			const tx = await contract.approve(
				Static.englishAuctionAddr,
				ethers.constants.MaxUint256)
      const receipt = await tx.wait(1)
      console.log(receipt)
      await fetchAllowance(address)
		} catch (e) {
			console.log(e)
			return false
		}

  }, [account, provider])

	return {allowance, fetchAllowance, createAllowance}
}

export const useFetchNftBalance = (defaultNftAddress=null, defaultOwnerAddress=null, defaultId=null) => {
  const [balance,setBalance] =useState(0)
	const {account, provider } = useWeb3React()

  const fetchNftBalance = useCallback(async (addressNft=defaultNftAddress, ownerAddress=defaultOwnerAddress, _id=defaultId) => {
		const contract = getExampleNft(provider, addressNft)
    try {
      const response = await contract.balanceOf(ownerAddress, _id)
      setBalance(ethers.utils.formatUnits(response, 18))
      return
    } catch (e) {
			console.log(e)
			return false
    }
  },[account, provider])

  return {balance, fetchNftBalance}
}

export const useFetchNftAllowance = (
  defaultNft=null,
  defaultOwner=null,
  defaultOperator=Static.englishAuctionAddr
) => {
	const {account, provider } = useWeb3React()
  const [allowance, setAllowance] = useState(null)
  
  const fetchAllowance = useCallback(async (
    nft=defaultNft,
    owner=defaultOwner,
    operator=defaultOperator
  ) => {
    console.log('fetching allowance')
    console.log('owner', owner)
    console.log('operator', operator)
		const contract = getExampleNft(provider, nft )
    try {
      const response = await contract.isApprovedForAll(owner, operator)
      console.log('allowance response', response)
      setAllowance(response)
    } catch (e) {
      console.log(e)
      return false
    }
  }, [account, provider])
  return { allowance, fetchAllowance }
}

export const useNft = () => {
	const {account, provider } = useWeb3React()
  // {id:number, amount:number}
  const [balances, setBalances] = useState({
    'account': null,
    'auctioneer': null
  })
  const [allowance, setAllowance] = useState(null)

  const createAllowance = useCallback(async (nftAddress) => {
    const signer = provider.getSigner()
		const contract = getExampleNft(signer, nftAddress)
    try {
      const response = await contract.setApprovalForAll(Static.englishAuctionAddr, true)
      const receipt = await response.wait(1)
      console.log('receipt', receipt)
    } catch (e) {
      console.log(e)
      return false
    }
  }, [account, provider])


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
    createAllowance,
    
  }
}
