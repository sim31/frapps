import { zEthAddress, zUrl } from "@ordao/ortypes";
import { zChainInfo } from "@ordao/ortypes/chainInfo.js";
import { z } from "zod";
import { DeploymentInfo } from "@ordao/orclient/createOrclient.js"

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
  chainInfo: zChainInfo,
  privyAppId: z.string()
});
export type Config = z.infer<typeof zConfig>;

const oldRespect = import.meta.env.VITE_OLD_RESPECT_ADDR;
const newRespect = import.meta.env.VITE_NEW_RESPECT_ADDR;
const orec = import.meta.env.VITE_OREC_ADDR;
const ornodeUrl = import.meta.env.VITE_ORNODE_URL;
const appTitle = import.meta.env.VITE_APP_TITLE;
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

const chainId = import.meta.env.VITE_CHAIN_ID;
const rpcUrls = JSON.parse(import.meta.env.VITE_RPC_URLS);
const chainName = import.meta.env.VITE_CHAIN_NAME;
const blockExplorerUrl = import.meta.env.VITE_BLOCKEXP_URL;

// console.log(oldRespect, newRespect, orec, ornodeUrl, appTitle);

export const config = zConfig.parse({
  contracts: {
    oldRespect, newRespect, orec
  },
  ornodeUrl,
  appTitle,
  chainInfo: {
    chainId,
    rpcUrls,
    chainName,
    blockExplorerUrl
  },
  privyAppId
});

export const deploymentInfo: DeploymentInfo = {
  ...config,
  title: appTitle
};

console.log("Loaded config: ", config);

