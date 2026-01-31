require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

const { SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY } = process.env;

const networks = {
  localhost: {
    url: "http://127.0.0.1:8545"
  }
};

if (SEPOLIA_RPC_URL && SEPOLIA_PRIVATE_KEY) {
  networks.sepolia = {
    url: SEPOLIA_RPC_URL,
    accounts: [SEPOLIA_PRIVATE_KEY]
  };
}

module.exports = {
  solidity: "0.8.20",
  networks
};
