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
export const AUCTIONS_KEY_MAP = 'AuctionsKeyMap'; // this semi colon was important to stringify
export const ARCHIVES_KEY_MAP = 'ArchivesKeyMap'; // this semi colon was important to stringify
export const getKeyMap = (km) => {
  return JSON.parse(localStorage.getItem(km)) || []; 
}
export const getAuctionsKeyMap = () => {
  return JSON.parse(localStorage.getItem(AUCTIONS_KEY_MAP)) || []; 
}
export const getArchivesKeyMap = () => {
  return JSON.parse(localStorage.getItem(ARCHIVES_KEY_MAP)) || []; 
}
export const getAuctions = (keyMap) => {
  const auct = keyMap.map((key, i) => {
    return JSON.parse(localStorage.getItem(key)) || [];
  })
  return auct
}
export const getAuction = (roomKey) => {
  return JSON.parse(localStorage.getItem(roomKey))
}

export const setAuctionCompleted = (roomKey) => {
  const auction = getAuction(roomKey)
  auction.completed = true
  localStorage.setItem(roomKey, JSON.stringify(auction))
}

export function parseAuctionForSig(auction) {
  let parsedAuction = Object.assign({}, auction)
  parsedAuction.bidStart = ethers.utils.parseUnits(auction.bidStart, 'ether')
  parsedAuction.deadline = Math.floor(auction.deadline.getTime() / 1000)
  return parsedAuction

}
export function parseBidForSig(bid) {
  let parsedBid = Object.assign({}, bid)
  parsedBid.amount = ethers.utils.parseUnits(bid.amount, 'ether')
  return parsedBid
}

export function parseConsumeForSig(roomKey) {
  const {auctionData, connection}= getAuction(roomKey)
  auctionData.deadline = Math.floor(new Date(auctionData.deadline).getTime() / 1000)
  // merge bidsigs into bids array
  auctionData.bids = auctionData.bids.map((bid, i) => {
    bid.bidSig = auctionData.bidSigs[i]
    return bid
  })
  // sort with them inside
  auctionData.bids = auctionData.bids.sort((a,b) => Number(b.amount) - Number(a.amount))
  // take them back into bidSig array order of sorted
  auctionData.bidSigs = auctionData.bids.map((bid) => {
    return bid.bidSig
  })
  auctionData.bids = auctionData.bids.map((bid) => {
    bid.amount = ethers.utils.parseUnits(bid.amount, 'ether')
    return bid
  })
  return auctionData

} 
