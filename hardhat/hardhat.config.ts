import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-deploy";
import "./tasks/deploy-english-auction";


if (!process.env.ALCHEMY_KEY) {
  throw new Error("ALCHEMY_KEY is not set");
}
if (!process.env.MNEMONIC) {
  throw new Error("MNEMONIC is not set");
}

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks: {
    hardhat: {
      saveDeployments: true,
      chainId: 1337,
      forking: {
        url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}` ,
        blockNumber: 27624458,
      },
      accounts: {
        mnemonic: process.env.MNEMONIC as string
      }
    },
    'base-sepolia': {
      saveDeployments: true,
      chainId: 84532,
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      accounts: {
        mnemonic: process.env.MNEMONIC as string
      }
    }
  },

};
export default config;