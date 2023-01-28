
exports.EIP712DOMAIN = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

exports.Auction = [
  { name: 'auctioneer', type:'address' },
  { name: 'nft', type:'address' },
  { name: 'nftId', type:'uint256' },
  { name: 'token', type:'address' },
  { name: 'bidStart', type:'uint256' },
  { name: 'deadline', type:'uint256' },
  { name: 'bids', type:'Bid[]' },
  { name: 'bidSigs', type:'bytes[]' },
]

exports.Bid = [
  { name: 'bidder', type:'address' },
  { name: 'amount', type:'uint256' },
  { name: 'nonce', type:'uint256' },
]

exports.englishAuctionTypes = {

}



