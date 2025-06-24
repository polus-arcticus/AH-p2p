import { keys } from '@libp2p/crypto'
const key = process.env.OWNER_KEY
export const loadOrCreatePrivateKey = async () => {
  if (!key) {
    throw new Error('OWNER_KEY environment variable is not set')
  }
  
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key
  const keyBuffer = new Uint8Array(Buffer.from(cleanKey, 'hex'))
  
  // Create Ed25519 private key from seed
  const privateKey = await keys.privateKeyFromRaw(keyBuffer, 'Ed25519')
  
  return privateKey
}
