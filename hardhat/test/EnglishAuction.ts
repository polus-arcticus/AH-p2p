import { HardhatRuntimeEnvironment } from 'hardhat/types';
import hre from 'hardhat'
import {parseEther, keccak256} from 'viem'
import { type WalletClient } from 'viem';
import { expect, assert } from 'chai';

import deployEnglishAuction  from '../deploy/deploy';
import { Bid, Auction, AuctionAuthSig } from './type-hashes';
function* idMaker() {
  var index = 0;
  while (true)
    yield index++;
}
describe("English Auction", async () => {
  const genId = idMaker()
  const auctionedNFTId = 0
  const million = parseEther('1000000')
  const hundredThousand = parseEther('100000')
  const tenThousand = parseEther('10000')
  const thousand = parseEther('1000')
  const hundred = parseEther('100')
  const deadline = Math.floor(new Date().getTime() / 1000) + 3600
  let chainId: number
  let domain: any
  let englishAuctionAddr: `0x${string}`
  let exampleTokenAddr: `0x${string}`
  let exampleNftAddr: `0x${string}`
  let accounts: WalletClient[]
  let deployer: WalletClient
  let auctioneer: WalletClient
  let bidder1: WalletClient
  let bidder2: WalletClient
  let bidder3: WalletClient
  let exampleToken: any
  let exampleNFT: any
  let englishAuction: any
  
  before(async () => {
    chainId = Number(await hre.getChainId())
    // Stage of Actors
    console.log('hre', hre.viem)
    ;([deployer, auctioneer, bidder1, bidder2, bidder3] = await hre.viem.getWalletClients())
    // deploy, loaded contract instances
    ;({
      englishAuctionAddr,
      exampleTokenAddr,
      exampleNftAddr
    } = await hre.run("deploy-english-auction", { isTest: true }))
    console.log('englishAuctionAddr', englishAuctionAddr)
    console.log('exampleTokenAddr', exampleTokenAddr)
    console.log('exampleNftAddr', exampleNftAddr)
    exampleToken = await hre.viem.getContractAt('ExampleToken', exampleTokenAddr)
    exampleNFT = await hre.viem.getContractAt('ExampleNFT', exampleNftAddr)
    englishAuction = await hre.viem.getContractAt('EnglishAuction', englishAuctionAddr)

    domain = {
      name:  'EnglishAuction',
      version: '1',
      chainId: chainId,
      verifyingContract: englishAuctionAddr
    }
    
    await exampleNFT.write.safeTransferFrom([
      deployer.account!.address,
      auctioneer.account!.address,
      auctionedNFTId,
      1,
      ""
    ])
    // authorizes auction contract to move nft
    await exampleNFT.write.setApprovalForAll([englishAuctionAddr, true],
      {
        account: auctioneer.account!
      }
    )

    //preloading example token for bidders
    await Promise.all(
      [bidder1,bidder2,bidder3].map(async (wallet, i) => {
        await exampleToken.write.transfer([wallet.account!.address,  million])
        // approves auction contract to move bidders funds
        await exampleToken.write.approve(
          [englishAuctionAddr, hundredThousand],
          {
            account: wallet.account!
          }
        )
      })
    )
  })

  it("allows an auctioneer to create an auction for a nft in base token", async () => {
    const nftBalanceBidder1_initial = await exampleNFT.read.balanceOf([bidder1.account!.address, auctionedNFTId])
    const tokenBalanceBidder1_initial = await exampleToken.read.balanceOf([bidder1.account!.address])
    const tokenBalanceAuctioneer_initial = await exampleToken.read.balanceOf([auctioneer.account!.address])

    // auctioneer creates an auction by starting the Auction Permit Chain
    let createAuction = {
      auctioneer: auctioneer.account!.address,
      auctioneerNonce: (await englishAuction.read.usedNonces([auctioneer.account!.address])).toString(),
      nft: exampleNftAddr,
      nftId: auctionedNFTId,
      token: exampleTokenAddr,
      bidStart: thousand,
      deadline:  deadline,
    }

    const auctionAuthSigHash = keccak256(await auctioneer.signTypedData({
      account: auctioneer.account!,
      domain,
      types: {
        AuctionAuthSig
      },
      primaryType: 'AuctionAuthSig',
      message: createAuction
    }))

    let auction = {
      ...createAuction,
      auctionSigHash: auctionAuthSigHash,
      bids: [],
      bidSigs: []
    }

    // bidder can add a bid to the bid and bidSig arrays
    const bid1LatestNonce = await englishAuction.read.usedNonces([bidder1.account!.address])
    const bid1Price = hundred;
    const bid1 = {
      bidder: bidder1.account!.address,
      amount: bid1Price,
      bidderNonce: bid1LatestNonce,
      auctionSigHash: auctionAuthSigHash
    }
    const bidSig1 = await bidder1.signTypedData({
      account: bidder1.account!,
      domain,
      types: {
        Bid
      },
      primaryType: 'Bid',
      message: bid1
    })
    // auctioneer pushes bid into the permit chain
    auction.bids.push(bid1)
    auction.bidSigs.push(bidSig1)
    
    const auctionSig = await auctioneer.signTypedData({
      account: auctioneer.account!,
      domain,
      types: {
        Auction,
        Bid
      },
      primaryType: 'Auction',
      message: auction
    })
    const auctionSigNo0x = auctionSig.substring(2)
    const r = '0x' + auctionSigNo0x.substring(0,64);
    const s = '0x' + auctionSigNo0x.substring(64,128);
    const v = parseInt(auctionSigNo0x.substring(128,130), 16)

    // Auctioneer consumes the auction on chain
    await englishAuction.write.consumeAuction([v,r,s, auction], {
      account: auctioneer.account!
    })

    const nftBalanceBidder1_final = await exampleNFT.read.balanceOf([bidder1.account!.address, auctionedNFTId])
    const tokenBalanceBidder1_final = await exampleToken.read.balanceOf([bidder1.account!.address])
    const tokenBalanceAuctioneer_final = await exampleToken.read.balanceOf([auctioneer.account!.address])

    expect(nftBalanceBidder1_initial).to.equal(0n)
    expect(nftBalanceBidder1_final).to.equal(1n)
    expect(tokenBalanceBidder1_initial - tokenBalanceBidder1_final).to.equal(bid1Price)
    expect(tokenBalanceAuctioneer_final - tokenBalanceAuctioneer_initial).to.equal(bid1Price)
  
    const bid1LatestNonce2 = await englishAuction.read.usedNonces([bidder1.account!.address])
    expect(bid1LatestNonce2 - bid1LatestNonce).to.equal(1n)
  })

  it("Takes highest bid contractually", async () => {
    await exampleNFT.write.safeTransferFrom(
      [deployer.account!.address, auctioneer.account!.address, auctionedNFTId, 1, '0x9e3779'],
      {
        account: deployer.account!
      }
    )

    const nftBalanceBidder1_initial = await exampleNFT.read.balanceOf([bidder1.account!.address, auctionedNFTId])
    const nftBalanceBidder2_initial = await exampleNFT.read.balanceOf([bidder2.account!.address, auctionedNFTId])
    const tokenBalanceBidder1_initial = await exampleToken.read.balanceOf([bidder1.account!.address])
    const tokenBalanceBidder2_initial = await exampleToken.read.balanceOf([bidder2.account!.address])
    const tokenBalanceAuctioneer_initial = await exampleToken.read.balanceOf([auctioneer.account!.address])
    
    let createAuction = {
      auctioneer: auctioneer.account!.address,
      auctioneerNonce: (await englishAuction.read.usedNonces([auctioneer.account!.address])).toString(),
      nft: exampleNftAddr,
      nftId: auctionedNFTId,
      token: exampleTokenAddr,
      bidStart: thousand,
      deadline:  deadline,
    }

    const auctionAuthSigHash = keccak256(await auctioneer.signTypedData({
      account: auctioneer.account!,
      domain,
      types: {
        AuctionAuthSig
      },
      primaryType: 'AuctionAuthSig',
      message: createAuction
    }))

    let auction = {
      ...createAuction,
      auctionSigHash: auctionAuthSigHash,
      bids: [],
      bidSigs: []
    }


    // bidder can add a bid to the bid and bidSig arrays
    const bid1LatestNonce = await englishAuction.read.usedNonces([bidder1.account!.address])
    const bidPrice1 = thousand
    const bid1 = {
      bidder: bidder1.account!.address,
      amount: bidPrice1,
      bidderNonce: bid1LatestNonce,
      auctionSigHash: auctionAuthSigHash
    }
    const bidSig1 = await bidder1.signTypedData({
      account: bidder1.account!,
      domain,
      types: {
        Bid
      },
      primaryType: 'Bid',
      message: bid1
    })
    // auctioneer pushes bid into the permit chain
    auction.bids.push(bid1)
    auction.bidSigs.push(bidSig1)
    
    // bidder 2 can add a bid to the bid and bidSig arrays
    const bid2LatestNonce = await englishAuction.read.usedNonces([bidder2.account!.address])
    const bidPrice2 = hundred
    const bid2 = {
      bidder: bidder2.account!.address,
      amount: bidPrice2,
      bidderNonce: bid2LatestNonce,
      auctionSigHash: auctionAuthSigHash
    }
    const bidSig2 = await bidder2.signTypedData({
      account: bidder2.account!,
      domain,
      types: {
        Bid
      },
      primaryType: 'Bid',
      message: bid2
    })
    // auctioneer pushes bid into the permit chain
    auction.bids.push(bid2)
    auction.bidSigs.push(bidSig2)

    const auctionData = {
      account: auctioneer.account!,
      domain,
      types: {
        Auction,
        Bid
      },
      primaryType: 'Auction',
      message: auction
    }
    console.log('auctionData', auctionData)
    const auctionSig = await auctioneer.signTypedData(auctionData)
    const auctionSigNo0x = auctionSig.substring(2)
    const r = '0x' + auctionSigNo0x.substring(0,64);
    const s = '0x' + auctionSigNo0x.substring(64,128);
    const v = parseInt(auctionSigNo0x.substring(128,130), 16)
    

    // Auctioneer consumes the auction on chain
    await englishAuction.write.consumeAuction([v,r,s, auction], {
      account: auctioneer.account!
    })

    const nftBalanceBidder1_final = await exampleNFT.read.balanceOf([bidder1.account!.address, auctionedNFTId])
    const nftBalanceBidder2_final = await exampleNFT.read.balanceOf([bidder2.account!.address, auctionedNFTId])
    const tokenBalanceBidder1_final = await exampleToken.read.balanceOf([bidder1.account!.address])
    const tokenBalanceBidder2_final = await exampleToken.read.balanceOf([bidder2.account!.address])
    const tokenBalanceAuctioneer_final = await exampleToken.read.balanceOf([auctioneer.account!.address])

    expect(nftBalanceBidder1_final - nftBalanceBidder1_initial).to.equal(1n)
    expect(nftBalanceBidder2_final - nftBalanceBidder2_initial).to.equal(0n)
    expect(tokenBalanceBidder1_initial - tokenBalanceBidder1_final).to.equal(bidPrice1)
    expect(tokenBalanceBidder2_initial - tokenBalanceBidder2_final).to.equal(0n)
    expect(tokenBalanceAuctioneer_final - tokenBalanceAuctioneer_initial).to.equal(bidPrice1)

  })
  it("fails if bids are not sorted from highest to lowest", async () => {
    await exampleNFT.write.safeTransferFrom(
      [deployer.account!.address, auctioneer.account!.address, auctionedNFTId, 1, '0x9e3779'],
      {
        account: deployer.account!
      }
    )

    const nftBalanceBidder1_initial = await exampleNFT.read.balanceOf([bidder1.account!.address, auctionedNFTId])
    const nftBalanceBidder2_initial = await exampleNFT.read.balanceOf([bidder2.account!.address, auctionedNFTId])
    const tokenBalanceBidder1_initial = await exampleToken.read.balanceOf([bidder1.account!.address])
    const tokenBalanceBidder2_initial = await exampleToken.read.balanceOf([bidder2.account!.address])
    const tokenBalanceAuctioneer_initial = await exampleToken.read.balanceOf([auctioneer.account!.address])
    
    let createAuction = {
      auctioneer: auctioneer.account!.address,
      auctioneerNonce: (await englishAuction.read.usedNonces([auctioneer.account!.address])).toString(),
      nft: exampleNftAddr,
      nftId: auctionedNFTId,
      token: exampleTokenAddr,
      bidStart: thousand,
      deadline:  deadline,
    }

    const auctionAuthSigHash = keccak256(await auctioneer.signTypedData({
      account: auctioneer.account!,
      domain,
      types: {
        AuctionAuthSig
      },
      primaryType: 'AuctionAuthSig',
      message: createAuction
    }))

    let auction = {
      ...createAuction,
      auctionSigHash: auctionAuthSigHash,
      bids: [],
      bidSigs: []
    }


    // bidder can add a bid to the bid and bidSig arrays
    const bid1LatestNonce = await englishAuction.read.usedNonces([bidder1.account!.address])
    const bidPrice1 = hundred
    const bid1 = {
      bidder: bidder1.account!.address,
      amount: bidPrice1,
      bidderNonce: bid1LatestNonce,
      auctionSigHash: auctionAuthSigHash
    }
    const bidSig1 = await bidder1.signTypedData({
      account: bidder1.account!,
      domain,
      types: {
        Bid
      },
      primaryType: 'Bid',
      message: bid1
    })
    // auctioneer pushes bid into the permit chain
    auction.bids.push(bid1)
    auction.bidSigs.push(bidSig1)
    
    // bidder 2 can add a bid to the bid and bidSig arrays
    const bid2LatestNonce = await englishAuction.read.usedNonces([bidder2.account!.address])
    const bidPrice2 = thousand
    const bid2 = {
      bidder: bidder2.account!.address,
      amount: bidPrice2,
      bidderNonce: bid2LatestNonce,
      auctionSigHash: auctionAuthSigHash
    }
    const bidSig2 = await bidder2.signTypedData({
      account: bidder2.account!,
      domain,
      types: {
        Bid
      },
      primaryType: 'Bid',
      message: bid2
    })
    // auctioneer pushes bid into the permit chain
    auction.bids.push(bid2)
    auction.bidSigs.push(bidSig2)

    const auctionSig = await auctioneer.signTypedData({
      account: auctioneer.account!,
      domain,
      types: {
        Auction,
        Bid
      },
      primaryType: 'Auction',
      message: auction
    })
    const auctionSigNo0x = auctionSig.substring(2)
    const r = '0x' + auctionSigNo0x.substring(0,64);
    const s = '0x' + auctionSigNo0x.substring(64,128);
    const v = parseInt(auctionSigNo0x.substring(128,130), 16)
    

    // Auctioneer consumes the auction on chain
    //
    await expect(
     englishAuction.write.consumeAuction([v,r,s, auction], {
      account: auctioneer.account!
    })
    ).to.be.rejectedWith('Please order the bids from highest to smallest prior to consuming, this saves gas')

  })

  it("goes to next highest highest bidder doesnt approve token to auction contract", async () => {
    await exampleNFT.write.safeTransferFrom(
      [
        deployer.account!.address,
        auctioneer.account!.address,
        auctionedNFTId,
        1,
        '0x9e3779'
      ],
      {
        account: deployer.account!
      }
    )

    const nftBalanceBidder1_initial = await exampleNFT.read.balanceOf([bidder1.account!.address, auctionedNFTId])
    const nftBalanceBidder2_initial = await exampleNFT.read.balanceOf([bidder2.account!.address, auctionedNFTId])
    const tokenBalanceBidder1_initial = await exampleToken.read.balanceOf([bidder1.account!.address])
    const tokenBalanceBidder2_initial = await exampleToken.read.balanceOf([bidder2.account!.address])
    const tokenBalanceAuctioneer_initial = await exampleToken.read.balanceOf([auctioneer.account!.address])
    
    let createAuction = {
      auctioneer: auctioneer.account!.address,
      auctioneerNonce: (await englishAuction.read.usedNonces([auctioneer.account!.address])).toString(),
      nft: exampleNftAddr,
      nftId: auctionedNFTId,
      token: exampleTokenAddr,
      bidStart: thousand,
      deadline:  deadline,
    }

    const auctionAuthSigHash = keccak256(await auctioneer.signTypedData({
      account: auctioneer.account!,
      domain,
      types: {
        AuctionAuthSig
      },
      primaryType: 'AuctionAuthSig',
      message: createAuction
    }))

    let auction = {
      ...createAuction,
      auctionSigHash: auctionAuthSigHash,
      bids: [],
      bidSigs: []
    }


    // bidder removes allowance on auction contract
    await exampleToken.write.approve([englishAuctionAddr, 0], {
      account: bidder1.account!
    })
    const bid1LatestNonce = await englishAuction.read.usedNonces([bidder1.account!.address])
    const bidPrice1 = thousand
    const bid1 = {
      bidder: bidder1.account!.address,
      amount: bidPrice1,
      bidderNonce: bid1LatestNonce,
      auctionSigHash: auctionAuthSigHash
    }
    const bidSig1 = await bidder1.signTypedData({
      account: bidder1.account!,
      domain,
      types: {
        Bid
      },
      primaryType: 'Bid',
      message: bid1
    })
    // auctioneer pushes bid into the permit chain
    auction.bids.push(bid1)
    auction.bidSigs.push(bidSig1)
    
    // bidder 2 can add a bid to the bid and bidSig arrays
    const bid2LatestNonce = await englishAuction.read.usedNonces([bidder2.account!.address])
    const bidPrice2 = hundred
    const bid2 = {
      bidder: bidder2.account!.address,
      amount: bidPrice2,
      bidderNonce: bid2LatestNonce,
      auctionSigHash: auctionAuthSigHash
    }
    const bidSig2 = await bidder2.signTypedData({
      account: bidder2.account!,
      domain,
      types: {
        Bid
      },
      primaryType: 'Bid',
      message: bid2
    })
    // auctioneer pushes bid into the permit chain
    auction.bids.push(bid2)
    auction.bidSigs.push(bidSig2)

    const auctionSig = await auctioneer.signTypedData({
      account: auctioneer.account!,
      domain,
      types: {
        Auction,
        Bid
      },
      primaryType: 'Auction',
      message: auction
    })
    const auctionSigNo0x = auctionSig.substring(2)
    const r = '0x' + auctionSigNo0x.substring(0,64);
    const s = '0x' + auctionSigNo0x.substring(64,128);
    const v = parseInt(auctionSigNo0x.substring(128,130), 16)
    

    // Auctioneer consumes the auction on chain
    await englishAuction.write.consumeAuction([v,r,s, auction], {
      account: auctioneer.account!
    })

    const nftBalanceBidder1_final = await exampleNFT.read.balanceOf([bidder1.account!.address, auctionedNFTId])
    const nftBalanceBidder2_final = await exampleNFT.read.balanceOf([bidder2.account!.address, auctionedNFTId])
    const tokenBalanceBidder1_final = await exampleToken.read.balanceOf([bidder1.account!.address])
    const tokenBalanceBidder2_final = await exampleToken.read.balanceOf([bidder2.account!.address])
    const tokenBalanceAuctioneer_final = await exampleToken.read.balanceOf([auctioneer.account!.address])

    expect(nftBalanceBidder1_final - nftBalanceBidder1_initial).to.equal(0n)
    expect(nftBalanceBidder2_final - nftBalanceBidder2_initial).to.equal(1n)
    expect(tokenBalanceBidder1_initial - tokenBalanceBidder1_final).to.equal(0n)
    expect(tokenBalanceBidder2_initial - tokenBalanceBidder2_final).to.equal(bidPrice2)
    expect(tokenBalanceAuctioneer_final - tokenBalanceAuctioneer_initial).to.equal(bidPrice2)

  })
})
