import hre, { ethers } from "hardhat";
import { SigningKey } from './utils/SigningKey'
import { BigNumber, Signer } from "ethers";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { signTypedData } from './utils/utils'
const { expect,assert } = require('chai')
import {
  encrypt,
  recoverPersonalSignature,
  recoverTypedSignature,
  TypedMessage,
  MessageTypes,
  SignTypedDataVersion
} from '@metamask/eth-sig-util';
const burnAddress ='0x000000000000000000000000000000000000dEaD'

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

const { deployDiamond } = require('../scripts/deploy.js')

function* idMaker() {
  var index = 0;
  while (true)
    yield index++;
}



describe("ReceiverPaysFacet", async () => {
  let genId = idMaker()
  let accounts 
  let diamondAddress 
  before(async () => {
    accounts = await ethers.getSigners();
    ;({diamond: diamondAddress, caw:cawAddress} = await deployDiamond())
    
    exampleToken = await ethers.getContractAt('StandardERC20', cawAddress)
    permitChain = await ethers.getContractAt('PermitChain', diamondAddress, accounts[0])
    const trillionExample = ethers.utils.parseEther('1000000000000')
    const billionExample = ethers.utils.parseEther('1000000000')
    await Promise.all(
      accounts.map(async (account, i) => {
        await exampleToken.transfer(account.address,  trillionExample)
        await exampleToken.connect(account).approve(diamondAddress, billionExample)
      })
    )
  })

  it("allows a user to deposit a token into the tipping pool", async () => {
    const thousandExample = ethers.utils.parseEther('1000')
    await permitChain.connect(accounts[1]).deposit(exampleAddress, thousandExample )
    const addressBalances = await permitChain.getDepositsByToken(exampleAddress)
    expect(senderAddress).to.equal(thousandExample)
  })
  it("a user cannot deposit into an nft they do not own", async () => {
    const thousandExample = ethers.utils.parseEther('1000')
    try {
      await permitChain.connect(accounts[2]).depositCaw(accounts[2], thousandExample)
      assert.fail('failed to prevent deposit ')
    } catch (e) {
      assert.include(e.message, 'ReceiverPaysFacet::must own nft')
    }
  })


  it("two users chain tips to same message for user", async () => {
    const thousandExample = ethers.utils.parseEther('1000')
    const hundredExample = ethers.utils.parseEther('100')

    //const acc5NftId = await usernameFacet.getNftIdByUsername('account5')
    //await permitChain.connect(accounts[5]).depositCaw(acc5NftId, thousandExample)
    //const acc5Deposits1 = await permitChain.getCawDepositsByNftId(acc5NftId)

    //const acc4NftId = await usernameFacet.getNftIdByUsername('account4')
    //await permitChain.connect(accounts[4]).depositCaw(acc4NftId, thousandExample)
    //const acc4Deposits1 = await permitChain.getCawDepositsByNftId(acc4NftId)

    await permitChain.connect(accounts[3]).deposit(tokenAddress, thousandExample)
    const acc3Deposits1 = await permitChain.getDeposits(tokenAddress)

    await permitChain.connect(accounts[2]).depositCaw(accounts[2], thousandExample)
    const acc2Deposits1 = await permitChain.getDeposits(tokenAddress)

    const claimerNftId = await usernameFacet.getNftIdByUsername('account1')
    const claimerDeposits1 = await permitChain.getDeposits(accounts[1])

    const chainId = (await ethers.provider.getNetwork()).chainId
    const networkId = 1 // hardhat doesn't seem to want to observe networkId

    const domain =  {
      chainId: chainId,
      name: 'Cawdrivium',
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
    await permitChain.connect(accounts[1]).claimTipChain(
      v,
      r,
      s,
      message
    )

    const acc3Deposits2 = await permitChain.getDeposits(tokenAddress)
    const acc2Deposits2 = await permitChain.getDeposits(tokenAddress)
    const claimerDeposits2 = await permitChain.getCawDepositsByNftId(claimerNftId)
    //console.log(ethers.utils.formatEther(senderDeposits2))
    expect(claimerDeposits1.add(hundredExample).add(hundredExample)).to.equal(claimerDeposits2)
    expect(acc2Deposits1.sub(hundredExample)).to.equal(acc2Deposits2)
    expect(acc3Deposits1.sub(hundredExample)).to.equal(acc3Deposits2)
  
    // Running again does not increase payout, blocked by Nonces
    await permitChain.connect(accounts[1]).claimTipChain(
      v,
      r,
      s,
      message
    )
    const acc3Deposits3 = await permitChain.getCawDepositsByNftId(acc3NftId)
    const acc2Deposits3 = await permitChain.getCawDepositsByNftId(acc2NftId)
    const claimerDeposits3 = await permitChain.getCawDepositsByNftId(claimerNftId)
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

    await permitChain.connect(accounts[1]).claimThings(
      v,
      r,
      s,
      message
    )
  })
 */
})

