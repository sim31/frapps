import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  mocha: {
    timeout: 90000
  },
  networks: {
    hardhat: {
      mining: {
        auto: false,
        interval: [500, 2000]
      }
    }
  }
};

export default config;
