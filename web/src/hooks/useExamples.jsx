mport { useEffect, useState, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import { getExampleToken, getExampleNft } from './utils'
import Static from 'config/Static.json'

export const useGetTokenBalance = (address) => {
	const [balance, setBalance] = useState("")
	const { account, provider } = useWeb3React()

	const fetchBalance = useCallback(async () => {
		console.log('fetching balance')
		const erc20 = getExampleToken(provider, address)
		try {
			setBalance(await erc20.methods.balanceOf(account).call({from:account}))

		} catch (e) {
			console.log(e)
			setBalance('0')
		}
	}, [account, address, provider])

	useEffect(() => {
		if (account && provider) {
			fetchBalance()
		}
	}, [account, provider, fetchBalance])

	return {balance, fetchBalance}
}

export const useGetAllowance = (address:string) => {
	const [allowance, setAllowance] = useState("")
	const { account, provider } = useWeb3React()

	const fetchAllowance = useCallback(async () => {
		const erc20 = getExampleToken(provider, address)
		const allow = await erc20.methods.allowance(account, Static.addresses.diamond).call({from:account})
		setAllowance(allow)
		console.log('fetch allowance')
	}, [account, address, provider])

	useEffect(() => {
		if (account) {
			fetchAllowance()
		}
	}, [fetchAllowance, account])

	return allowance
}


export const useSetAllowance = (address: string, amount:number) => {
	const {account, provider } = useWeb3React()

	const handleApprove = useCallback(async () => {
		console.log('handleApprove')
		const contract = getExampleToken(provider, address)
		try {
			const approve = await contract.methods.approve(
				Static.addresses.diamond,
				provider.utils.toWei(String(amount), 'ether')
			).send({ from: account })
			return approve.status
		} catch (e) {
			console.log(e)
			return false
		}
	}, [account, provider, amount, address])

	return { onApprove: handleApprove }
}


export const useNft = (address) => {
	const {account, provider } = useWeb3React()
  // {id:number, amount:number}
  const [balances, setBalances] = useState({})
  const [allowance, setAllowance] = useState(null)

  const fetchBalance = useCallback((id) => {
		const contract = getExampleNft(provider, address)
    try {
      const response = await contract.balanceOf(account, id)
      const existing = balances.find((balance) => balance.id == id)
      balances[id] = response
      setBalances(balances)
    } catch (e) {
			console.log(e)
			return false
    }
  },[])

  const fetchAllowance = useCallback((auctioneer) => {
		const contract = getExampleNft(provider, address)
    try {
      const response = await contract.isApprovedForAll(auctioneer, contract.address)
      setAllowance(response)
    } catch (e) {
      console.log(e)
      return false
    }
  }, [])
  const setAllowance = useCallback((auctioneer) => {
		const contract = getExampleNft(provider, address)
    try {
      const response = await contract.setApprovalForAll(contract.address, auctioneer)
      setAllowance(response)
    } catch (e) {
      console.log(e)
      return false
    }
  }, [])


  const createSafeTransferFrom = useCallback((auctioneer, bidder, id, amount, data) => {
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
    setAllowance,
    allowance,
    fetchBalance,
    balances,
    createSafeTransferFrom
    
  }
}
