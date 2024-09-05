import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  // That's configuration for verification through blockscout
  networks: {
    'op-mainnet': {
      url: 'https://mainnet.optimism.io'
    },
  },
  etherscan: {
    apiKey: {
      'op-mainnet': 'empty'
    },
    customChains: [
      {
        network: "op-mainnet",
        chainId: 10,
        urls: {
          apiURL: "https://optimism.blockscout.com/api",
          browserURL: "https://optimism.blockscout.com"
        }
      }
    ]
  }
};

export default config;
