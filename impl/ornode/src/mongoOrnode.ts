import { Config, config } from "./config.js";
import { ORNode } from "./ornode.js";
import { MongoOrdb } from "./mongo-ordb/mongoOrdb.js";
import { IORNode, Url } from "ortypes";
import { ResettingResilientWs } from "./resilientWs/resetingResilientWs.js";
import { ContractRunner, WebSocketProvider } from "ethers";

let ornode: Promise<IORNode>;

export async function createORNode(
  config: Config,
  mordb: MongoOrdb,
  contractRunner: Url | ContractRunner
) {
  return ORNode.create({
      newRespect: config.contracts.newRespect,
      orec: config.contracts.orec,
      contractRunner,
      tokenCfg: config.tokenMetadataCfg,
      startPeriodNumber: config.ornode.startPeriodNum,
      listenToEvents: config.ornode.listenForEvents
    }, mordb);
}

// Has to set ornode
export async function createHttpOrnode(
  config: Config,
  mordb: MongoOrdb,
  providerUrl: Url
) {
  console.log("Creating http ornode");
  ornode = createORNode(config, mordb, providerUrl);
}

// Has to set ornode
export async function createWebsocketOrnode(config: Config, mordb: MongoOrdb) {
  const terminate = ResettingResilientWs(
    config.providerUrl,
    config.ornode.wsResetInterval,
    async (wsp: WebSocketProvider) => {
      // On reconnection - same mordb, new orcontext and corresponding ornode object
      // But ornode variable is private here so it is not a problem.
      ornode = createORNode(config, mordb, wsp);
    }
  )
  return terminate;
}

export async function init() {
  const mordb = await MongoOrdb.create({
    mongoUrl: config.mongoCfg.url,
    dbName: config.mongoCfg.dbName,
    propStoreConfig: config.ornode.proposalStore,
    awardStoreConfig: config.ornode.proposalStore,
    voteStoreConfig: config.ornode.awardStore,
  });

  const url = new URL(config.providerUrl);
  if (url.protocol === "wss:") {
    createWebsocketOrnode(config, mordb);
  } else {
    createHttpOrnode(config, mordb, config.providerUrl);
  }
  await ornode;
}

export async function getOrnode() {
  try {
    return await ornode;
  } catch(err) {
    console.error(err);
    throw err;
  }
}