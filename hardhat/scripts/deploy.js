// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function deployTipChain() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const ExampleNFT = await hre.ethers.getContractFactory('ExampleNFT')
  const exampleNFT = await ExampleNFT.deploy()

  const ExampleToken = await hre.ethers.getContractFactory('ExampleToken')
  const exampleToken = await ExampleToken.deploy(hre.ethers.utils.parseEther('1000000'))
  const TipChain = await hre.ethers.getContractFactory("TipChain");
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

async function deployEnglishAuction() {
  const ExampleNft = await hre.ethers.getContractFactory('ExampleNFT')
  const exampleNft = await ExampleNft.deploy()

  const ExampleToken = await hre.ethers.getContractFactory('ExampleToken')
  const exampleToken = await ExampleToken.deploy(hre.ethers.utils.parseEther('1000000000'))

  const EnglishAuction = await hre.ethers.getContractFactory("EnglishAuction");
  const englishAuction  = await EnglishAuction.deploy()
  console.log(
    'English Auction Deploy',
    ` EnglishAuction deployed to ${englishAuction.address}`
  );

  return { 'englishAuctionAddr':englishAuction.address, 'exampleTokenAddr':exampleToken.address, 'exampleNftAddr': exampleNft.address }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
async function deploy() {
  await deployTipChain()
  await deployEnglishAuction()
}
deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

exports.deployTipChain = deployTipChain
exports.deployEnglishAuction = deployEnglishAuction
