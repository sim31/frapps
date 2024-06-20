import { createConfig } from "express-zod-api";
import fs from "fs";
import { zEthAddress } from "ortypes";
import { z } from "zod"
import "dotenv/config";
import jsonfile from "jsonfile";

export const zContractsAddrs = z.object({
  oldRespect: zEthAddress.optional(),
  newRespect: zEthAddress,
  orec: zEthAddress
});
export type ContractsAddrs = z.infer<typeof zContractsAddrs>;

export const zConfig = z.object({
  contracts: zContractsAddrs,
  providerUrl: z.string().url(),
});
export type Config = z.infer<typeof zConfig>;

const configPathVar = process.env.ORNODE_CFG_PATH;
let configPath = configPathVar !== undefined ? configPathVar : './dev-config.json';

const configObj = jsonfile.readFileSync(configPath);
console.log("Loaded config object: ", configObj);
export const config = zConfig.parse(configObj);
console.log("Loaded config: ", config);

export const ezConfig = createConfig({
  server: {
    listen: 8090, // port, UNIX socket or options
  },
  cors: true,
  logger: { level: "debug", color: true },
});
