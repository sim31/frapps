import { zEthAddress, zUrl } from "ortypes";
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
  appTitle: z.string()
});
export type Config = z.infer<typeof zConfig>;

const oldRespect = import.meta.env.VITE_OLD_RESPECT_ADDR;
const newRespect = import.meta.env.VITE_NEW_RESPECT_ADDR;
const orec = import.meta.env.VITE_OREC_ADDR;
const ornodeUrl = import.meta.env.VITE_ORNODE_URL;
const appTitle = import.meta.env.VITE_APP_TITLE;

// console.log(oldRespect, newRespect, orec, ornodeUrl, appTitle);

export const config = zConfig.parse({
  contracts: {
    oldRespect, newRespect, orec
  },
  ornodeUrl,
  appTitle
});

console.log("Loaded config: ", config);

