import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as fs from 'fs';
import { parseEther } from "viem";

import EnglishAuctionJson from '../artifacts/contracts/EnglishAuction.sol/EnglishAuction.json'
import ExampleNFTJson from '../artifacts/contracts/mocks/ExampleNFT.sol/ExampleNFT.json'
import ExampleTokenJson from '../artifacts/contracts/mocks/ExampleToken.sol/ExampleToken.json'

// Hardhat task for deployment
task("deploy-english-auction", "Deploy English Auction and optionally mock contracts")
  .addFlag("isTest", "Deploy with mock ERC20 and ERC1155 contracts for testing")
  .setAction(async (taskArgs, hre) => {
    const { isTest } = taskArgs;
    const viem = hre.viem;
    const [deployer, auctioneer, bidderOne, bidderTwo, bidderThree] = await viem.getWalletClients()
    
    console.log(`Deploying contracts with isTest=${isTest}...`);
    
    const englishAuction = await viem.deployContract('EnglishAuction')
    console.log(`EnglishAuction deployed to: ${englishAuction.address}`);
    
    if (isTest) {
      const exampleNFT = await viem.deployContract('ExampleNFT')
      const exampleToken = await viem.deployContract('ExampleToken', [parseEther('10000000000000')])
      
      console.log(`ExampleNFT deployed to: ${exampleNFT.address}`);
      console.log(`ExampleToken deployed to: ${exampleToken.address}`);
      
      const contractData = {
        englishAuctionAddr: englishAuction.address,
        exampleTokenAddr: exampleToken.address,
        exampleNftAddr: exampleNFT.address,
        englishAuctionAbi: EnglishAuctionJson.abi,
        exampleTokenAbi: ExampleTokenJson.abi,
        exampleNftAbi: ExampleNFTJson.abi,
      };
      
      // Write to both locations for testnet
      fs.writeFileSync('./export/StaticTestnet.json', JSON.stringify(contractData));
      fs.writeFileSync('../web/src/assets/Static.json', JSON.stringify(contractData));
      
      console.log('Contract addresses written to StaticTestnet.json and Static.json');
      
      return {
        englishAuctionAddr: englishAuction.address,
        exampleTokenAddr: exampleToken.address,
        exampleNftAddr: exampleNFT.address,
      }
    } else {
      const contractData = {
        englishAuctionAddr: englishAuction.address,
        englishAuctionAbi: EnglishAuctionJson.abi,
      };
      
      fs.writeFileSync('../web/src/assets/Static.json', JSON.stringify(contractData));
      
      console.log('Contract addresses written to Static.json');
      
      return {
        englishAuctionAddr: englishAuction.address,
      }
    }
  });

export default async (
  hre: HardhatRuntimeEnvironment,
  isTestnet: boolean = false,
) => {
  // Use the task for deployment
  return await hre.run("deploy-contracts", { isTest: isTestnet });
}