export const substringAddr = (address) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}
