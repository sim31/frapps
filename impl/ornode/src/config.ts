import { createConfig } from "express-zod-api";
import fs from "fs";
import { zContractMetadata, zEthAddress } from "ortypes";
import { z } from "zod"
import "dotenv/config";
import jsonfile from "jsonfile";
import { zRespectFungibleMt } from "ortypes/respect1155.js";
import { zProposalStoreConfig } from "./mongo-ordb/proposalStore.js";
import { zAwardStoreConfig } from "./mongo-ordb/awardStore.js";
import { zVoteStoreConfig } from "./mongo-ordb/voteStore.js";

export const zMongoConfig = z.object({
  url: z.string(),
  dbName: z.string()
});

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
  fungible: zRespectFungibleMt,
  contract: zContractMetadata
});
export type TokenMtCfg = z.infer<typeof zTokenMtCfg>;

export const zSwaggerUICfg = z.object({
  ornodeEndpoint: z.string().url().default("http://localhost:8090"),
  host: z.string().default("localhost"),
  port: z.number().default(9000)
});
export type SwaggerUICfg = z.infer<typeof zSwaggerUICfg>;

export const zSyncConfig = z.object({
  fromBlock: z.coerce.number().int().nonnegative(),
  toBlock: z.literal("latest").or(z.coerce.number().int().nonnegative()),
  // Logs cannot be queried for unlimited range of blocks (e.g.: https://github.com/ethers-io/ethers.js/issues/1798).
  // So we sync in steps of `stepRange` until we get from `fromBlock` to latest block
  stepRange: z.number().int().nonnegative().default(8000),
});
export type SyncConfig = z.infer<typeof zSyncConfig>;

export const zOrnodeCfg = z.object({
  host: z.string().default("localhost"),
  port: z.number().default(8090),
  startPeriodNum: z.number().int().gte(0).default(0),
  proposalStore: zProposalStoreConfig.default({}),
  awardStore: zAwardStoreConfig.default({}),
  voteStore: zVoteStoreConfig.default({}),
  sync: zSyncConfig.optional(),
  listenForEvents: z.boolean().default(true),
  wsResetInterval: z.number().int().default(86400)
    .describe("Interval in seconds for how often to reset wss connection. 0 for never.")
})
export type OrnodeCfg = z.infer<typeof zOrnodeCfg>;

export const zConfig = z.object({
  contracts: zContractsAddrs,
  providerUrl: z.string().url(),
  tokenMetadataCfg: zTokenMtCfg,
  mongoCfg: zMongoConfig,
  swaggerUI: zSwaggerUICfg.default({}), // Defaults used
  ornode: zOrnodeCfg.default({}) // Defaults used
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
    listen: {
      port: config.ornode.port,
      host: config.ornode.host
    }
  },
  cors: true,
  logger: { level: "debug", color: true },
});
