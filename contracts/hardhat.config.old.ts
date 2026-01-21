import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  paths: {
    sources: "src"
  },
  networks: {
    optimism: {
      url: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [
        process.env.OP_PRIV_KEY!,
      ]
    },
    opSepolia: {
      url: `https://optimism-sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [
        process.env.OPSEPOLIA_PRIV_KEY!,
      ],
    },
    base: {
      url: `https://base-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [
        process.env.BASE_PRIV_KEY!,
      ],
    },
    baseSepolia: {
      url: `https://base-sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [
        process.env.BASESEPOLIA_PRIV_KEY!,
      ],
    }
  },
  etherscan: {
    apiKey: {
      optimisticEthereum: process.env.OP_ETHERSCAN_KEY!,
      opSepolia: process.env.OPSEPOLIA_ETHERSCAN_KEY!,
      optimism: process.env.OP_ETHERSCAN_KEY!,
      base: process.env.BASE_ETHERSCAN_KEY!,
      baseSepolia: process.env.BASESEPOLIA_ETHERSCAN_KEY!,
    },
    customChains: [
      {
        network: "opSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io"
        }
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"

        }
      }
    ]
  }
};

export default config;
