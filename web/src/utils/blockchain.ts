import { type WalletClient } from "viem"

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