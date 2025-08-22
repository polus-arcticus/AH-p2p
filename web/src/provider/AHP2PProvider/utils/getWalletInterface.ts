import type { WalletClient } from "viem"
import type { WalletInterface } from "../../../types/orbitdb"

export const getWalletInterface = ({
  address,
  walletClient
}: {
  address: `0x${string}`,
  walletClient: WalletClient
}): WalletInterface => {
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
