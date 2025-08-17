import {
  useCallback,
  useEffect,
  useState
} from "react";

import { createHeliaNode } from "./createHeliaNode";

import { useWalletClient } from "wagmi";
import { type DocumentsDatabase, createOrbitDB, useIdentityProvider  } from '@orbitdb/core'
import type { OrbitDB } from '@orbitdb/core'
import * as OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'

import type { Multiaddr } from '@multiformats/multiaddr'

export const useOrbit = () => {
  useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
  const [orbit, setOrbit] = useState<OrbitDB | null>(null)
  const [auctionsDB, setAuctionsDB] = useState<DocumentsDatabase | null>(null)
  const [selfAddress, setSelfAddress] = useState<Multiaddr | null>(null)
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState<boolean>(true)

  const { data: walletClient } = useWalletClient()

  const startOrbit = useCallback(async () => {
    if (!walletClient) return

    try {
      setLoading(true)
      setError(undefined)

      const {helia, selfWebRTCMultiaddr, dbAddrs} = await createHeliaNode() 
      setSelfAddress(selfWebRTCMultiaddr)
      // Create OrbitDB instance - the identity will be created automatically
      // using the registered Ethereum identity provider
      const orbit = await createOrbitDB({
        ipfs: helia
      }) as OrbitDB

      const auctionsDB = await orbit.open(dbAddrs.auctionsDBAddress)
      console.log('auctionsDB', auctionsDB)

      console.log('OrbitDB created', orbit)

      setOrbit(orbit)
      setAuctionsDB(auctionsDB)
      setLoading(false)

    } catch (err:unknown) {
      setError(err as Error)
      setLoading(false)
    }
  }, [walletClient])



  useEffect(() => {
    if (!walletClient) return
    startOrbit()
  }, [startOrbit, walletClient])

  return {
    orbit,
      selfAddress,
    error,
    loading,
    auctionsDB
  }
}
