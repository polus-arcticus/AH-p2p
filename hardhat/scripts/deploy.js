// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require('fs')
const EnglishAuctionJson = require('../artifacts/contracts/EnglishAuction.sol/EnglishAuction.json')
const ExampleNFTJson = require('../artifacts/contracts/mocks/ExampleNFT.sol/ExampleNFT.json')
const ExampleTokenJson = require('../artifacts/contracts/mocks/ExampleToken.sol/ExampleToken.json')


async function deployTipChain() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;
  
  const ExampleNFT = await ethers.getContractFactory('ExampleNFT')
  const exampleNFT = await ExampleNFT.deploy({gasLimit: 120000000, gasPrice: 1000 })
  console.log('exampleNFT created')
  const ExampleToken = await ethers.getContractFactory('ExampleToken')
  const exampleToken = await ExampleToken.deploy(hre.ethers.utils.parseEther('1000000'))
  console.log('exampleToken created')
  
  const TipChain = await ethers.getContractFactory('TipChain')
  const tipChain  = await TipChain.deploy()

  await tipChain.deployed()
  await exampleNFT.deployed()
  await exampleToken.deployed()

  console.log(
    ' PermitChain Contract Deployed',
    ` PermitChain deployed to ${tipChain.address}`
  );

  return { 'tipChainAddr':tipChain.address, 'exampleTokenAddr':exampleToken.address, 'exampleNFTAddr': exampleNFT.address }
}

async function deployEnglishAuction(withSeed) {
  const [deployer] = await ethers.getSigners()
  const weiAmount = (await deployer.getBalance()).toString()
  console.log("Account balance:", (await ethers.utils.formatEther(weiAmount)));

  const feeData = await ethers.provider.getFeeData()
  delete feeData.lastBaseFeePerGas
  delete feeData.maxFeePerGas
  delete feeData.maxPriorityFeePerGas
  console.log('attempting to deploy english auction')
  const ExampleNFT = await ethers.getContractFactory('ExampleNFT')
  const exampleNFT = await ExampleNFT.deploy()
  await exampleNFT.deployed()
  const weiAmount2 = (await deployer.getBalance()).toString()
  console.log("Account balance:", (await ethers.utils.formatEther(weiAmount2)));
  console.log('exampleNFT complete')
  const feeData2 = await ethers.provider.getFeeData()
  const EnglishAuction = await ethers.getContractFactory('EnglishAuction')
  const englishAuction  = await EnglishAuction.deploy()
  await englishAuction.deployed()
  console.log('english complete')
  const ExampleToken = await ethers.getContractFactory('ExampleToken')
  console.log(ethers.utils.parseEther('1000000000'))
  const exampleToken = await ExampleToken.deploy(ethers.utils.parseEther('1000000000'), feeData)
  console.log('exampleToken complete')
  await exampleToken.deployed()

  console.log(
    'English Auction Deploy',
    ` EnglishAuction deployed to ${englishAuction.address}`
  );
  if (withSeed) {
    const nftAuctionId = 0
    const thousand = hre.ethers.utils.parseEther('1000')
    console.log('attempt get accounts')
    const accounts = await ethers.getSigners();
    const deployer = accounts[0]
    const auctioneer = accounts[1]
    const bidderOne = accounts[2]
    const bidderTwo = accounts[3]
    const bidderThree = accounts[4]
    console.log('attempting to move nft')
    const weiAmount3 = (await deployer.getBalance()).toString()
    console.log("Account balance:", (await ethers.utils.formatEther(weiAmount3)));
    const nftResponse = await exampleNFT.connect(deployer).safeTransferFrom(deployer.address,auctioneer.address, nftAuctionId, 1, 0x0, {gasLimit: 100000})
    const weiAmount4 = (await deployer.getBalance()).toString()
    console.log("Account balance:", (await ethers.utils.formatEther(weiAmount4)));
    console.log('attempting to move tokens')
    await exampleToken.connect(deployer).transfer(bidderOne.address,  thousand, {gasLimit: 100000})
    await exampleToken.connect(deployer).transfer(bidderTwo.address,  thousand, {gasLimit: 100000})
    await exampleToken.connect(deployer).transfer(bidderThree.address,  thousand, {gasLimit: 100000})
    console.log('exampleToken')
    /* doesn't seem to like promise.all this (ProviderError: HttpProviderError)
    await Promise.all(
      [bidderOne,bidderTwo,bidderThree].map(async (account, i) => {
        return await exampleToken.connect(deployer).transfer(account.address,  thousand)
        // approves auction contract to move bidders funds
        //await exampleToken.connect(account).approve(englishAuctionAddr, hundredThousand)
      })
    )
    */ 
    console.log('seed complete')
  }
 fs.writeFileSync('../web/src/assets/Static.json',JSON.stringify({
    englishAuctionAddr: englishAuction.address,
    exampleTokenAddr: exampleToken.address,
    exampleNftAddr: exampleNFT.address,
    englishAuctionAbi: EnglishAuctionJson.abi,
    exampleTokenAbi: ExampleTokenJson.abi,
    exampleNftAbi: ExampleNFTJson.abi,
  }), (err) => {
    if (err) {
      throw err
    } else {
      console.log('Diamond Address Written to orbitdb directory')
    }
  })


  return { 'englishAuctionAddr':englishAuction.address, 'exampleTokenAddr':exampleToken.address, 'exampleNftAddr': exampleNFT.address }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
async function deploy() {
  //await deployTipChain()
  await deployEnglishAuction(true)
}
deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

exports.deployTipChain = deployTipChain
exports.deployEnglishAuction = deployEnglishAuction
