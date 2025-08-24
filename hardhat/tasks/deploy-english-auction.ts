import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as fs from 'fs';
import * as path from 'path';
import { parseEther } from "viem";

//import EnglishAuctionJson from '../artifacts/contracts/EnglishAuction.sol/EnglishAuction.json'
//import ExampleNFTJson from '../artifacts/contracts/mocks/ExampleNFT.sol/ExampleNFT.json'
//import ExampleTokenJson from '../artifacts/contracts/mocks/ExampleToken.sol/ExampleToken.json'

// Hardhat task for deployment
task("deploy-english-auction", "Deploy English Auction and optionally mock contracts")
  .addFlag("isTest", "Deploy with mock ERC20 and ERC1155 contracts for testing")
  .addFlag("verify", "Verify contracts on Etherscan")
  .setAction(async (taskArgs, hre) => {
    const { isTest, verify } = taskArgs;
    const viem = hre.viem;
    const [auctioneer, bidderOne, bidderTwo, bidderThree] = await viem.getWalletClients()
    
    console.log(`Deploying contracts with isTest=${isTest}...`);
    const chainId = Number(await hre.getChainId())
    
    const englishAuction = await viem.deployContract('EnglishAuction')
    console.log(`EnglishAuction deployed to: ${englishAuction.address}`);
    
    if (isTest) {
      const exampleNFT = await viem.deployContract('ExampleNFT')
      const exampleToken = await viem.deployContract('ExampleToken')
      
      console.log(`ExampleNFT deployed to: ${exampleNFT.address}`);
      console.log(`ExampleToken deployed to: ${exampleToken.address}`);

      await exampleToken.write.transfer([bidderOne.account.address, parseEther('1000')])
      await exampleToken.write.transfer([bidderTwo.account.address, parseEther('1000')])
      await exampleToken.write.transfer([bidderThree.account.address, parseEther('1000')])

      const contractData = {
        englishAuctionAddr: englishAuction.address,
        exampleTokenAddr: exampleToken.address,
        exampleNftAddr: exampleNFT.address,
        englishAuctionAbi: englishAuction.abi,
        exampleTokenAbi: exampleToken.abi,
        exampleNftAbi: exampleNFT.abi,
      };
      
      // Write to both locations for testnet
      const exportDir = `./export/${chainId}`;
      const webAssetsDir = `../web/src/assets/${chainId}`;
      
      // Create directories if they don't exist
      fs.mkdirSync(exportDir, { recursive: true });
      fs.mkdirSync(webAssetsDir, { recursive: true });
      
      fs.writeFileSync(path.join(exportDir, 'StaticTestnet.json'), JSON.stringify(contractData, null, 2));
      fs.writeFileSync(path.join(webAssetsDir, 'Static.json'), JSON.stringify(contractData, null, 2));
      
      console.log(`Contract addresses written to ${chainId}/StaticTestnet.json and Static.json`);
      
      if (verify) {
        await hre.run("verify:verify", { address: englishAuction.address });
        await hre.run("verify:verify", { address: exampleToken.address });
        await hre.run("verify:verify", { address: exampleNFT.address });
      }
      
      return {
        englishAuctionAddr: englishAuction.address,
        exampleTokenAddr: exampleToken.address,
        exampleNftAddr: exampleNFT.address,
      }
    } else {
      const contractData = {
        englishAuctionAddr: englishAuction.address,
        englishAuctionAbi: englishAuction.abi,
      };
      
      const webAssetsDir = `../web/src/assets/${chainId}`;
      
      // Create directory if it doesn't exist
      fs.mkdirSync(webAssetsDir, { recursive: true });
      
      fs.writeFileSync(path.join(webAssetsDir, 'Static.json'), JSON.stringify(contractData, null, 2));
      
      console.log(`Contract addresses written to ${chainId}/Static.json`);

      if (verify) {
        await hre.run("verify:verify", { address: englishAuction.address });
      }
      
      return {
        englishAuctionAddr: englishAuction.address,
      }
    }
  });