const hre = require('hardhat')
const SignerWithAddress = require('@nomiclabs/hardhat-ethers/signers')
const { expect,assert } = require('chai')
const {
  encrypt,
  recoverPersonalSignature,
  recoverTypedSignature,
  TypedMessage,
  MessageTypes,
  SignTypedDataVersion
} = require('@metamask/eth-sig-util');

const { deployEnglishAuction } = require('../scripts/deploy.js')
const { BID_TYPE_HASH, AUCTION_TYPE_HASH } = require('./type-hashes.js')
function* idMaker() {
  var index = 0;
  while (true)
    yield index++;
}

describe("English Auction", async () => {
  
  const genId = idMaker()
  const auctionedNftId = 0
  const million = hre.ethers.utils.parseEther('1000000')
  const hundredThousand = hre.ethers.utils.parseEther('100000')
  const tenThousand = hre.ethers.utils.parseEther('10000')
  const thousand = hre.ethers.utils.parseEther('1000')
  const hundred = hre.ethers.utils.parseEther('100')
  let chainId
  let englishAuctionAddr
  let exampleTokenAddr
  let exampleNftAddr
  let accounts
  let deployer
  let auctioneer
  let bidder1
  let bidder2
  let bidder3
  
  before(async () => {
    chainId = (await hre.ethers.provider.getNetwork()).chainId
    // Stage of Actors
    accounts = await hre.ethers.getSigners();
    deployer = accounts[0]
    auctioneer = accounts[1]
    bidder1 = accounts[2]
    bidder2 = accounts[3]
    bidder3 = accounts[4]

    // deploy, loaded contract instances
    ;({englishAuctionAddr, exampleTokenAddr, exampleNftAddr} = await deployTipchain())
    exampleToken = await hre.ethers.getContractAt('ExampleToken', tipChainAddr)
    exampleNft = await hre.ethers.getContractAt('ExampleNft', exampleNftAddr)
    englishAuction = await hre.ethers.getContractAt('EnglishAuction', englishAuctionAddr)

    // nft for auctioneer to auction
    await exampleNft.connect(deployer).safeTransferFrom(deployer.address,auctioneer.address, auctionedNftId, 1)
    

    //preloading example token for bidders
    await Promise.all(
      [bidder1,bidder2,bidder3].map(async (account, i) => {
        await exampleToken.connect(deployer).transfer(account.address,  million)
        //await exampleToken.connect(account).approve(englishAuctionAddr, billionExample)
      })
    )
  })

  it("allows an auctioneer to create an auction for a nft in base token", async () => {

    const domain = {
      chainId: chainId,
      name:  'EnglishAuction',
      verifyingContract: englishAuctionAddr,
      version: '1'
    }
    // auctioneer creates an auction by starting the Auction Permit Chain
    const deadline = Math.floor(new Date().getTime() / 1000) + 3600
    let auction = {
      auctioneer: auctioneer.address,
      nft: exampleNftAddr,
      nftId: auctionedNftId,
      token: exampleTokenAddr,
      bidStart: thousand,
      deadline:  deadline,
      bids: [],
      bidSigs: []
    }

    // bidder can add a bid to the bid and bidSig arrays
    const bid1 = {
      bidder: bidder1.address,
      amount: hundred,
      nonce: 0
    }
    const bidSig1 = await bidder1._signTypedData(
      domain,
      { BID_TYPE_HASH },
      bid1
    )
    auction.bids.push(bid1)
    auction.bidSigs.push(bidSig1)

    const auctionSig = await auctioneer._signTypedData(
      domain,
      { AUCTION_TYPE_HASH, BID_TYPE_HASH },
      auction
    )
    const auctionSigNo0x = auctionSig.substring(2)
    const r = '0x' + auctionSigNo0x.substring(0,64);
    const s = '0x' + auctionSigNo0x.substring(64,128);
    const v = parseInt(auctionSigNo0x.substring(128,130), 16)

    await englishAuction.connect(auctioneer).consumeAuction(v,r,s, auction)
  })

  it("allows a bidder to place a bid on the auction permit chain", async () => {

  })

  it("allows the auctioneer to process the auction permit chain after deadline", async () => {

  })
})
