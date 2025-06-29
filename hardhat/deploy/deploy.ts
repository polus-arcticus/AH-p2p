import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (hre.network.name === 'hardhat') {
    await hre.run("deploy-english-auction", { isTest: true });
  } else {
    await hre.run("deploy-english-auction", { isTest: false });
  }
}


export default func;


/*
async function deployTipChain() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;
  
  const ExampleNFT = await ethers.getContractFactory('ExampleNFT')
  const exampleNFT = await ExampleNFT.deploy({gasLimit: 120000000, gasPrice: 1000 })
  const ExampleToken = await ethers.getContractFactory('ExampleToken')
  const exampleToken = await ExampleToken.deploy(hre.ethers.utils.parseEther('1000000'))
  
  const TipChain = await ethers.getContractFactory('TipChain')
  const tipChain  = await TipChain.deploy()

  await tipChain.deployed()
  await exampleNFT.deployed()
  await exampleToken.deployed()

  return { 'tipChainAddr':tipChain.address, 'exampleTokenAddr':exampleToken.address, 'exampleNFTAddr': exampleNFT.address }
}

async function deployEnglishAuction(withSeed?: boolean) {
  const [deployer] = await ethers.getSigners()
  const weiAmount = (await deployer.getBalance()).toString()

  const feeData = await ethers.provider.getFeeData()
  delete feeData.lastBaseFeePerGas
  delete feeData.maxFeePerGas
  delete feeData.maxPriorityFeePerGas
  const ExampleNFT = await ethers.getContractFactory('ExampleNFT')
  const exampleNFT = await ExampleNFT.deploy()
  await exampleNFT.deployed()
  const weiAmount2 = (await deployer.getBalance()).toString()
  const feeData2 = await ethers.provider.getFeeData()
  const EnglishAuction = await ethers.getContractFactory('EnglishAuction')
  const englishAuction  = await EnglishAuction.deploy()
  await englishAuction.deployed()
  const ExampleToken = await ethers.getContractFactory('ExampleToken')
  const exampleToken = await ExampleToken.deploy(ethers.utils.parseEther('1000000000'), feeData)
  await exampleToken.deployed()

  if (withSeed) {
    const nftAuctionId = 0
    const thousand = hre.ethers.utils.parseEther('1000')
    const accounts = await ethers.getSigners();
    const deployer = accounts[0]
    const auctioneer = accounts[1]
    const bidderOne = accounts[2]
    const bidderTwo = accounts[3]
    const bidderThree = accounts[4]
    const weiAmount3 = (await deployer.getBalance()).toString()
    const nftResponse = await exampleNFT.connect(deployer).safeTransferFrom(deployer.address,auctioneer.address, nftAuctionId, 1, 0x0, {gasLimit: 100000})
    const weiAmount4 = (await deployer.getBalance()).toString()
    await exampleToken.connect(deployer).transfer(bidderOne.address,  thousand, {gasLimit: 100000})
    await exampleToken.connect(deployer).transfer(bidderTwo.address,  thousand, {gasLimit: 100000})
    await exampleToken.connect(deployer).transfer(bidderThree.address,  thousand, {gasLimit: 100000})
    console.log('seed complete')
  }
 fs.writeFileSync('../web/src/assets/Static.json',JSON.stringify({
    englishAuctionAddr: englishAuction.address,
    exampleTokenAddr: exampleToken.address,
    exampleNftAddr: exampleNFT.address,
    englishAuctionAbi: EnglishAuctionJson.abi,
    exampleTokenAbi: ExampleTokenJson.abi,
    exampleNftAbi: ExampleNFTJson.abi,
  }));


  return { 'englishAuctionAddr':englishAuction.address, 'exampleTokenAddr':exampleToken.address, 'exampleNftAddr': exampleNFT.address }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
*/