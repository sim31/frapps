import { zEthAddress, zUrl } from "ortypes";
import { zChainInfo } from "ortypes/chainInfo.js";
import { z } from "zod";

export const zContractsAddrs = z.object({
  oldRespect: zEthAddress.optional(),
  newRespect: zEthAddress,
  orec: zEthAddress
});
export type ContractsAddrs = z.infer<typeof zContractsAddrs>;

export const zConfig = z.object({
  contracts: zContractsAddrs,
  ornodeUrl: zUrl,
  appTitle: z.string(),
  chainInfo: zChainInfo
});
export type Config = z.infer<typeof zConfig>;

const oldRespect = import.meta.env.VITE_OLD_RESPECT_ADDR;
const newRespect = import.meta.env.VITE_NEW_RESPECT_ADDR;
const orec = import.meta.env.VITE_OREC_ADDR;
const ornodeUrl = import.meta.env.VITE_ORNODE_URL;
const appTitle = import.meta.env.VITE_APP_TITLE;

const chainId = import.meta.env.VITE_CHAIN_ID;
const rpcUrls = JSON.parse(import.meta.env.VITE_RPC_URLS);
const chainName = import.meta.env.VITE_CHAIN_NAME;
const blockExplorerUrl = import.meta.env.VITE_BLOCKEXP_URL;

const cfgValues = {
  contracts: { oldRespect, newRespect, orec },
  ornodeUrl,
  appTitle,
  chainInfo: {
    chainId,
    rpcUrls,
    chainName,
    blockExplorerUrl
  }
}

console.log("Parsing config: ", cfgValues);

export const config = zConfig.parse(cfgValues);

console.debug("Loaded config: ", config);

