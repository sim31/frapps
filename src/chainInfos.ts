import { ChainInfo } from "@ordao/ortypes/chainInfo.js";
import { NetworkId } from "./types/baseDeploymentCfg.js";

export const chainInfos: Record<NetworkId, Omit<ChainInfo, "nativeCurrency">> = {
  "optimism": {
    "chainId": "0xA",
    "rpcUrls": ["https://1rpc.io/op", "https://optimism.publicnode.com", "https://mainnet.optimism.io/"],
    "chainName": "Optimism",
    "blockExplorerUrl": "https://optimism.blockscout.com",
  },
  "opSepolia": {
    "chainId": "0xAA37DC",
    "rpcUrls": ["https://optimism-sepolia-rpc.publicnode.com", "https://op-sepolia-testnet.rpc.thirdweb.com/", "https://sepolia.optimism.io"],
    "chainName": "OP Sepolia",
    "blockExplorerUrl": "https://optimism-sepolia.blockscout.com/"
  },
  "base": {
    "chainId": "0x2105",
    "rpcUrls": ["https://base-rpc.publicnode.com", "https://0xrpc.io/base", "https://1rpc.io/base"],
    "chainName": "Base Mainnet",
    "blockExplorerUrl": "https://base.blockscout.com/"
  },
  "baseSepolia": {
    "chainId": "0x14a34",
    "rpcUrls": ["https://base-sepolia.drpc.org"],
    "chainName": "Base Sepolia",
    "blockExplorerUrl": "https://base-sepolia.blockscout.com/"
  }
}