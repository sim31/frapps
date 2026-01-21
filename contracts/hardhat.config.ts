import { configVariable, defineConfig } from "hardhat/config";
import hardhatIgnition from "@nomicfoundation/hardhat-ignition";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import "dotenv/config";

export default defineConfig({
  plugins: [hardhatIgnition, hardhatVerify],
  solidity: "0.8.28",
  paths: {
    sources: "src",
  },
  networks: {
    optimism: {
      type: "http",
      chainType: "op",
      chainId: 10,
      url: configVariable(
        "INFURA_KEY",
        "https://optimism-mainnet.infura.io/v3/{variable}",
      ),
      accounts: [configVariable("OP_PRIV_KEY")],
    },
    opSepolia: {
      type: "http",
      chainType: "op",
      chainId: 11155420,
      url: configVariable(
        "INFURA_KEY",
        "https://optimism-sepolia.infura.io/v3/{variable}",
      ),
      accounts: [configVariable("OPSEPOLIA_PRIV_KEY")],
    },
    base: {
      type: "http",
      chainType: "op",
      chainId: 8453,
      url: configVariable(
        "INFURA_KEY",
        "https://base-mainnet.infura.io/v3/{variable}",
      ),
      accounts: [configVariable("BASE_PRIV_KEY")],
    },
    baseSepolia: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: configVariable(
        "INFURA_KEY",
        "https://base-sepolia.infura.io/v3/{variable}",
      ),
      accounts: [configVariable("BASESEPOLIA_PRIV_KEY")],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
  chainDescriptors: {
    11155420: {
      name: "opSepolia",
      blockExplorers: {
        etherscan: {
          name: "Optimism Sepolia Explorer",
          url: "https://sepolia-optimism.etherscan.io",
        },
      },
    },
    84532: {
      name: "baseSepolia",
      blockExplorers: {
        etherscan: {
          name: "Base Sepolia Explorer",
          url: "https://sepolia.basescan.org",
        },
      },
    },
  },
});
