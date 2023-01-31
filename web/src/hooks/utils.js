import Static from '@/assets/Static.json'
import { ethers } from 'ethers'
export const getEnglishAuction = (provider) => {
  return new ethers.Contract(Static.englishAuctionAddr, Static.englishAuctionAbi, provider )
}
export const getExampleToken = (provider, address) => {
  return new ethers.Contract(address, Static.exampleTokenAbi, provider )
}
export const getExampleNft = (provider, address) => {
  return new ethers.Contract(address, Static.exampleNftAbi, provider )
}
