//import hre, { ethers } from "hardhat";
const hre = require('hardhat')
//import { SigningKey } from './utils/SigningKey'
//import { BigNumber, Signer } from "ethers";
const SignerWithAddress = require('@nomiclabs/hardhat-ethers/signers')
//import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
//import { signTypedData } from './utils/utils'
const { expect,assert } = require('chai')
const {
  encrypt,
  recoverPersonalSignature,
  recoverTypedSignature,
  TypedMessage,
  MessageTypes,
  SignTypedDataVersion
} = require('@metamask/eth-sig-util');

const { deployTipchain } = require('../scripts/deploy.js')

function* idMaker() {
  var index = 0;
  while (true)
    yield index++;
}



describe("Tipchain", async () => {
  let genId = idMaker()
  let accounts 
  let diamondAddress 
  before(async () => {
    accounts = await hre.ethers.getSigners();

    ;({tipChainAddr, exampleTokenAddr} = await deployTipchain())
    
    exampleToken = await hre.ethers.getContractAt('ExampleToken', tipChainAddr)
    tipChain = await hre.ethers.getContractAt('Tipchain', tipChainAddr, accounts[0])
    const trillionExample = hre.ethers.utils.parseEther('1000000000000')
    const billionExample = hre.ethers.utils.parseEther('1000000000')
    await Promise.all(
      accounts.map(async (account, i) => {
        await exampleToken.transfer(account.address,  trillionExample)
        await exampleToken.connect(account).approve(tipChainAddr, billionExample)
      })
    )
  })

  it("allows a user to deposit a token into the tipping pool", async () => {
    const thousandExample = hre.ethers.utils.parseEther('1000')
    await tipChain.connect(accounts[1]).deposit(exampleTokenAddr, thousandExample )
    const addressBalances = await tipChain.getDepositsByToken(exampleTokenAddr)
    expect(senderAddress).to.equal(thousandExample)
  })

  it("a user cannot deposit into an nft they do not own", async () => {
    const thousandExample = hre.ethers.utils.parseEther('1000')
    try {
      await tipChain.connect(accounts[2]).deposit(exampleTokenAddr, thousandExample)
      assert.fail('failed to prevent deposit ')
    } catch (e) {
      assert.include(e.message, 'ReceiverPaysFacet::must own nft')
    }
  })


  it("two users chain tips to same message for user", async () => {
    const thousandExample = hre.ethers.utils.parseEther('1000')
    const hundredExample = hre.ethers.utils.parseEther('100')

    //const acc5NFTId = await usernameFacet.getNFTIdByUsername('account5')
    //await tipChain.connect(accounts[5]).depositCaw(acc5NFTId, thousandExample)
    //const acc5Deposits1 = await tipChain.getCawDepositsByNFTId(acc5NFTId)

    //const acc4NFTId = await usernameFacet.getNFTIdByUsername('account4')
    //await tipChain.connect(accounts[4]).depositCaw(acc4NFTId, thousandExample)
    //const acc4Deposits1 = await tipChain.getCawDepositsByNFTId(acc4NFTId)

    await tipChain.connect(accounts[3]).deposit(exampleTokenAddr, thousandExample)
    const acc3Deposits1 = await tipChain.getDeposits(tokenAddress)

    await tipChain.connect(accounts[2]).deposit(exampleTokenAddr, thousandExample)
    const acc2Deposits1 = await tipChain.getDeposits(tokenAddress)

    const claimerDeposits1 = await tipChain.getDeposits(accounts[1])

    const chainId = (await hre.ethers.provider.getNetwork()).chainId
    const networkId = 1 // hardhat doesn't seem to want to observe networkId

    const domain =  {
      chainId: chainId,
      name: 'Tipchain',
      verifyingContract: diamondAddress,
      version: '1'
    }
    const deadline = Math.floor(new Date().getTime() / 1000) + 3600

    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      TipChain: [
        { name: 'claimer', type: 'address' },
        { name: 'deadline', type: 'uint256' },
        { name: 'tips', type: 'Tip[]' },
        { name: 'tipSigs', type: 'bytes[]' },
      ],
      Tip: [
        { name: 'sender', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'senderNonce', type: 'uint256' }
      ]
    }

    const ethersTipChainType = { // Tried to be ergonomic by providing EIP712 domain
      TipChain: [
        { name: 'claimer', type: 'address' },
        { name: 'deadline', type: 'uint256' },
        { name: 'tips', type: 'Tip[]' },
        { name: 'tipSigs', type: 'bytes[]' },
      ],
      Tip: [
        { name: 'sender', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'senderNonce', type: 'uint256' }
      ]
    }
    const ethersTipType = { // Tried to be ergonomic by providing EIP712 domain
      Tip: [
        { name: 'sender', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'senderNonce', type: 'uint256' }
      ]
    }
    // love to see an ipfs hash chain as these,
    //
    let message = {
      claimer: accounts[2], // this nft can sweep funds
      deadline: deadline, // when the bus leaves, matched with lock on deposit box
      tips: [],
      tipSigs: [],
    }
    // account 3 leaves a tip in claimer tip jar,
    const acc3Tip = {
      sender: accounts[3],
      amount: hundredExample.toString(),
      senderNonce: 0 // Nonce does not get iterated until claim, so pass current nonce in orbitdb, orbit-db bus meta
    }
    message.tips.push(acc3Tip)

    const acc3TipSignature = await accounts[3]._signTypedData(
      domain,
      ethersTipType,
      acc3Tip
    )

    message.tipSigs.push(acc3TipSignature)


    // account 2 leaves a tip in the claimer tip jar 
    const acc2Tip = {
      sender: accounts[2],
      amount: hundredExample.toString(),
      senderNonce: 0
    }
    message.tips.push(acc2Tip)

    const acc2TipSignature = await accounts[2]._signTypedData(
      domain,
      ethersTipType,
      acc2Tip
    )
    message.tipSigs.push(acc2TipSignature)
    console.log(message)

    const msgParams  = {
      domain,
      message,
      primaryType: 'TipChain',
      types
    }

    // claimer signing the package
   /* splice out of the ethers _signTypedData() in case needed
    const wallet = ethers.Wallet.createRandom()
    
    console.log('========================')
    console.log(
      await signTypedData(
        new SigningKey(wallet.privateKey),
        domain,
        ethersTipChainType,
          message
      )
    )

    console.log('========================')
   */
    const signature = await accounts[1]._signTypedData(
      domain,
      ethersTipChainType,
      message
    )

    const signatureSans0x = signature.substring(2)
    const r = '0x' + signatureSans0x.substring(0,64);
    const s = '0x' + signatureSans0x.substring(64,128);
    const v = parseInt(signatureSans0x.substring(128,130), 16)
    console.log('v: ', v)
    console.log('r: ', r)
    console.log('s: ', s)
    const recoverAddr = recoverTypedSignature({data: msgParams, signature, version: SignTypedDataVersion.V4 })
    console.log('recoveraddr', recoverAddr)
    console.log('acc2: ', accounts[2].address)
    expect(recoverAddr).to.equal(accounts[1].address.toLowerCase())
    await tipChain.connect(accounts[1]).claimTipChain(
      v,
      r,
      s,
      message
    )

    const acc3Deposits2 = await tipChain.getDeposits(exampleTokenAddr)
    const acc2Deposits2 = await tipChain.getDeposits(exampleTokenAddr)
    const claimerDeposits2 = await tipChain.getCawDepositsByNFTId(claimerNFTId)
    //console.log(ethers.utils.formatEther(senderDeposits2))
    expect(claimerDeposits1.add(hundredExample).add(hundredExample)).to.equal(claimerDeposits2)
    expect(acc2Deposits1.sub(hundredExample)).to.equal(acc2Deposits2)
    expect(acc3Deposits1.sub(hundredExample)).to.equal(acc3Deposits2)
  
    // Running again does not increase payout, blocked by Nonces
    await tipChain.connect(accounts[1]).claimTipChain(
      v,
      r,
      s,
      message
    )
    const acc3Deposits3 = await tipChain.getCawDepositsByNFTId(acc3NFTId)
    const acc2Deposits3 = await tipChain.getCawDepositsByNFTId(acc2NFTId)
    const claimerDeposits3 = await tipChain.getCawDepositsByNFTId(claimerNFTId)
    expect(claimerDeposits2).to.equal(claimerDeposits3)
    expect(acc2Deposits2).to.equal(acc2Deposits3)
    expect(acc3Deposits2).to.equal(acc3Deposits3)


  })

  it("Try generate hash collisions by spoofing v, r, s inputs", async () =>{
    // initial signatures are decomposed into r,s,v components before hitting the chain to save gas
    // Remember reading an article that its easy to create collisions by byte swapping parts from v and r
    // find that paper
    // see if possible
  })

  it("Try to spoof the encodePacked signatures", async () => {
    /*If you use keccak256(abi.encodePacked(a, b)) and both a and b are dynamic types, it is easy to craft collisions in the hash value by moving parts of a into b and vice-versa. More specifically, abi.encodePacked("a", "bc") == abi.encodePacked("ab", "c"). If you use abi.encodePacked for signatures, authentication or data integrity, make sure to always use the same types and check that at most one of them is dynamic. Unless there is a compelling reason, abi.encode should be preferred. */
  })

  it("Block gas limit stuff", async () => {
    // If a message gets super long, it is logical it will putter out
    // What would be the max length of a message? what hits 30 mil gas
    // is there variation in gas based on params, what are the variations
    // gas optimization considerations
  })

  it("Hub model exploration", async () => {
    // Current ClaimTipChain functionality only becomes efficient once a user gets alot of high value tips
    // While doing a daily, weekly, and monthly deposit timelock deadlines may help new users get efficient, it costs time
    // Another way could be use a pancakeswap style harvest() function, and a non user specific tip chain, so when the message gets to max length, anyone can run the signature in exchange for an onchain network incentive
    // Intuitions tells me to look closely at merkle trees
    // https://medium.com/@ItsCuzzo/using-merkle-trees-for-nft-whitelists-523b58ada3f9
  })



/*
 * Nice for understanding how the nested struct arrays worked
  it("nested struct test", async () => {
    const thousandExample = ethers.utils.parseEther('1000')
    const hundredExample = ethers.utils.parseEther('100')
    const chainId = (await ethers.provider.getNetwork()).chainId

    const domain =  {
      chainId: chainId,
      name: 'Cawdrivium',
      verifyingContract: diamondAddress,
      version: '1'
    }
    const deadline = Math.floor(new Date().getTime() / 1000) + 3600

    const types: MessageTypes = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Thing: [
        {name: 'id', type: 'uint256'}
      ],
      Things: [
        {name:'things', type: 'Thing[]'}
      ]
    }

    const ethersThingType = {
      Thing: [
        {name: 'id', type: 'uint256'}
      ],
      Things: [
        {name:'things', type: 'Thing[]'}
      ]
    }

    const message = {
      things: [{id:1}, {id:2}]  
    }

    const signature = await accounts[1]._signTypedData(
      domain,
      ethersThingType,
      message
    )
    console.log(signature)

    const msgParams = {
      domain,
      message,
      primaryType: 'Things',
      types
    }
    const recoverAddr = recoverTypedSignature({data, signature, version  })
    console.log(accounts[1].address, recoverAddr)

    const signatureSans0x = signature.substring(2)
    const r = '0x' + signatureSans0x.substring(0,64);
    const s = '0x' + signatureSans0x.substring(64,128);
    const v = parseInt(signatureSans0x.substring(128,130), 16)

    await tipChain.connect(accounts[1]).claimThings(
      v,
      r,
      s,
      message
    )
  })
 */
})

