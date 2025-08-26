import {
  useCallback,
  useEffect,
  useState
} from "react";

import { createHeliaNode } from "./createHeliaNode";

import { useWalletClient, useAccount } from "wagmi";
import { type DocumentsDatabase, createOrbitDB, useIdentityProvider  } from '@orbitdb/core'
import type { OrbitDB } from '@orbitdb/core'
import * as OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'

import type { Multiaddr } from '@multiformats/multiaddr'
import type { WalletClient } from 'viem'

export const getWalletInterface = ({
  address,
  walletClient
}:{
  address: `0x${string}`,
  walletClient: WalletClient
}) => {
  return {
    address: address,
    getAddress: () => address,
    signMessage: async (message: string) => {
      const oldSig = localStorage.getItem(address)
      if (oldSig) return oldSig
      const signature = await walletClient.signMessage({
        message,
        account: address
      })
      localStorage.setItem(address, signature)
      return signature
    }
  }
}


export const useOrbit = () => {
  useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
  const [orbit, setOrbit] = useState<OrbitDB | null>(null)
  const [auctionsDB, setAuctionsDB] = useState<DocumentsDatabase | null>(null)
  const [selfAddress, setSelfAddress] = useState<Multiaddr | null>(null)
  const [peerId, setPeerId] = useState<string | null>(null)
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState<boolean>(true)

  const { data: walletClient } = useWalletClient()
  const {address} = useAccount()

  const startOrbit = useCallback(async () => {
    console.log('trying to start orbit')
    console.log('walletClient', Boolean(walletClient))
    console.log('address', Boolean(address))
    if (!walletClient || !address) return

    try {
      setLoading(true)
      setError(undefined)

      const {helia, selfWebRTCMultiaddr, dbAddrs} = await createHeliaNode(address, walletClient) 
      setSelfAddress(selfWebRTCMultiaddr)

      const walletInterface = getWalletInterface({
        address: address as `0x${string}`,
        walletClient: walletClient
      })

      const ethProvider = OrbitDBIdentityProviderEthereum.default({
        wallet: walletInterface
      })
     
      const orbit = await createOrbitDB({
        ipfs: helia,
        identity: {provider: ethProvider}

      }) as OrbitDB

      const auctionsDB = await orbit.open(dbAddrs.auctionsDBAddress)
      console.log('auctionsDB', auctionsDB)
      console.log('auctionsDB all', await auctionsDB.all())

      console.log('OrbitDB created', orbit)

      setOrbit(orbit)
      setAuctionsDB(auctionsDB)
      setLoading(false)
      setPeerId(helia.libp2p.peerId.toString())

    } catch (err:unknown) {
      setError(err as Error)
      setLoading(false)
    }
  }, [walletClient, address])



  useEffect(() => {
    if (!walletClient || !address) return
    startOrbit()
  }, [startOrbit, walletClient, address])

  return {
    orbit,
      selfAddress,
      peerId,
    error,
    loading,
    auctionsDB
  }
}
