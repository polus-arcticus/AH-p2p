import { keys } from '@libp2p/crypto'
import { keccak256, hexToBytes } from 'viem'
import type { WalletClient } from 'viem'

import { englishAuctionAddr } from '@/assets/Static.json'

const EIP712_TYPES = {
  PeerIdSeed: [
    { name: 'message', type: 'string' },
    { name: 'nonce', type: 'uint256' }
  ]
}

const PEER_ID_MESSAGE = 'Generate deterministic libp2p peer ID seed'
const PEER_ID_NONCE = 1n

/**
 * Creates a persistent libp2p peer ID using EIP-712 signature as deterministic seed
 * This ensures the same Ethereum address always generates the same peer ID
 */
export const createPersistentPeerId = async (
  address: `0x${string}`,
  walletClient: WalletClient
): Promise<any> => {
  const chainId = await walletClient.getChainId()
  const cacheKey = `ah-p2p-peer-id-${address}`

  const domain = {
    name: 'AH-P2P Network',
    version: '1',
    chainId,
    verifyingContract: englishAuctionAddr as `0x${string}`
  }
  
  // Check if we already have a cached peer ID for this address
  const cachedPeerId = localStorage.getItem(cacheKey)
  if (cachedPeerId) {
    try {
      const keyData = JSON.parse(cachedPeerId)
      const privateKey = await keys.privateKeyFromRaw(
        new Uint8Array(keyData.privateKey)
      )
      console.log('🔑 Loaded cached peer ID for address:', address)
      return privateKey
    } catch (error) {
      console.warn('Failed to load cached peer ID, generating new one:', error)
      localStorage.removeItem(cacheKey)
    }
  }

  console.log('🔑 Generating new persistent peer ID for address:', address)

  // Create EIP-712 signature as deterministic seed
  const signature = await walletClient.signTypedData({
    account: address,
    domain,
    types: EIP712_TYPES,
    primaryType: 'PeerIdSeed',
    message: {
      message: PEER_ID_MESSAGE,
      nonce: PEER_ID_NONCE
    }
  })

  // Use signature as seed material for Ed25519 key generation
  const signatureBytes = hexToBytes(signature)
  const seedHash = keccak256(signatureBytes)
  const seedBytes = hexToBytes(seedHash)

  // Create Ed25519 private key from deterministic seed
  const privateKey = await keys.privateKeyFromRaw(seedBytes)

  // Cache the private key data for future use
  const keyData = {
    privateKey: Array.from(seedBytes),
    address,
    timestamp: Date.now()
  }
  localStorage.setItem(cacheKey, JSON.stringify(keyData))

  console.log('🔑 Generated persistent peer ID:', privateKey.publicKey.toString())
  return privateKey
}

/**
 * Clear cached peer ID for an address (useful for testing or key rotation)
 */
export const clearCachedPeerId = (address: `0x${string}`) => {
  const cacheKey = `ah-p2p-peer-id-${address}`
  localStorage.removeItem(cacheKey)
  console.log('🗑️ Cleared cached peer ID for address:', address)
}
