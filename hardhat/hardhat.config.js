require('dotenv').config()
require("@nomicfoundation/hardhat-toolbox");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    docker: {
      url: 'http://ganache-cli:8545',
      chainId: 31337,
      accounts: {
        mnemonic: process.env.MNEMONIC
      },
      gas: 30000000000
    }
  },

};
