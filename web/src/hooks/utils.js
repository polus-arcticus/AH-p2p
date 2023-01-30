import Static from '@/assets/Static.json'

export const getEnglishAuction = (provider) => {
  return new provider.ethers.Contract(Static.EnglishAuctionAddr, Static.EnglishAuctionAbi )
}
export const getExampleToken = (provider) => {
  return new provider.ethers.Contract(Static.ExampleTokenAddr, Static.ExampleTokenAbi )
}
export const getExampleNft = (provider) => {
  return new provider.ethers.Contract(Static.ExampleNftAddr, Static.ExampleNftAbi )
}
