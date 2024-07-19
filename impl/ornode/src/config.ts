import { createConfig } from "express-zod-api";
import fs from "fs";
import { zEthAddress } from "ortypes";
import { z } from "zod"
import "dotenv/config";
import jsonfile from "jsonfile";
import { zRespectFungibleMt } from "ortypes/respect1155.js";

export const zContractsAddrs = z.object({
  oldRespect: zEthAddress.optional(),
  newRespect: zEthAddress,
  orec: zEthAddress
});
export type ContractsAddrs = z.infer<typeof zContractsAddrs>;

export const zTokenMtCfg = z.object({
  award: z.object({
    name: z.string(),
    description: z.string().optional(),
    image: z.string().url().optional(),
  }),
  fungible: zRespectFungibleMt
});
export type TokenMtCfg = z.infer<typeof zTokenMtCfg>;

export const zConfig = z.object({
  contracts: zContractsAddrs,
  providerUrl: z.string().url(),
  tokenMetadataCfg: zTokenMtCfg
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
