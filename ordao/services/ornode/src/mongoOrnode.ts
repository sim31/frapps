import { Config, config } from "./config.js";
import { ORNode } from "./ornode.js";
import { MongoOrdb } from "./mongo-ordb/mongoOrdb.js";
import { IORNode, Url } from "ortypes";
import { ResilientWebsocket } from "./resilientWebsocket/index.js";
import { ContractRunner, WebSocketProvider } from "ethers";

export let ornode: Promise<IORNode>;

export function registerEventHandlers(ornode: ORNode) {
  if (config.ornode.listenForEvents) {
    ornode.registerEventHandlers();
    console.debug("Registered for events");
  } else {
    console.warn("Skipping registration to events");
  }
}

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
    }, mordb);
}

export async function createHttpOrnode(
  config: Config,
  mordb: MongoOrdb,
  providerUrl: Url
) {
  console.log("Creating http ornode");
  const orn = await createORNode(config, mordb, providerUrl);
  registerEventHandlers(orn);
  return orn;
}

export async function createWebsocketOrnode(config: Config, mordb: MongoOrdb) {
  return new Promise<IORNode>((resolve) => {
    console.log("Creating ws ornode");
    let ornPromise: Promise<ORNode> | undefined;
    // TODO: use terminate when quiting?
    const terminate = ResilientWebsocket(
      config.providerUrl,
      async (wsp: WebSocketProvider) => {
        if (ornPromise === undefined) {
          ornPromise = createORNode(config, mordb, wsp);

          const orn = await ornPromise;
          if (config.ornode.sync === undefined) {
            console.log("registering event handlers for the first time")
            registerEventHandlers(orn);
          }
          resolve(orn);
        } else {
          console.log("Reconnection. Re-registering event handlers")
          if (config.ornode.sync === undefined) {
            const orn = await ornPromise;
            registerEventHandlers(orn);
          }
        }
      }
    )
  })
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
    ornode = createWebsocketOrnode(config, mordb);
  } else {
    ornode = createHttpOrnode(config, mordb, config.providerUrl);
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