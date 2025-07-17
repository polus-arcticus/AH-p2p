import {
  useCallback,
  useEffect,
  useState
} from "react";

import { createHeliaNode } from "./createHeliaNode";
import { getWalletInterface } from "./utils/getWalletInterface";
import { useWalletClient } from "wagmi";
import { createOrbitDB, useIdentityProvider  } from '@orbitdb/core'

import { OrbitDBIdentityProviderEthereum } from "@orbitdb/identity-provider-ethereum";


export const useOrbitDB = () => {
  useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
  const [orbit, setOrbit] = useState<any>(null)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const {data: walletClient} = useWalletClient()

  const startBootstrapNode = useCallback(async () => {
    if (!walletClient) return

      setLoading(true)
      setError(null)

      const helia = await createHeliaNode()

      const walletInterface = getWalletInterface({
        address: walletClient.account.address,
        walletClient
      })

      const ethProvider = OrbitDBIdentityProviderEthereum.default({ wallet: walletInterface })

      const orbit = await createOrbitDB({
        ipfs:helia,
        identity: {provider: ethProvider}
      })

      setOrbit(orbit)
      setLoading(false)

  }, [walletClient])



  useEffect(() => {
    if (!walletClient) return
    startBootstrapNode()
  }, [startBootstrapNode, walletClient])

  return {
    orbit,
    error,
    loading
  }
}
