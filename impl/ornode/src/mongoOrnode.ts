import { config } from "./config.js";
import { ORNode } from "./ornode.js";
import { MongoOrdb } from "./mongo-ordb/mongoOrdb.js";
import { IORNode } from "ortypes";

export let ornode: Promise<IORNode>;

export async function init() {
  const mordb = await MongoOrdb.create({
    mongoUrl: config.mongoCfg.url,
    dbName: config.mongoCfg.dbName
  });

  ornode = ORNode.create({
    newRespect: config.contracts.newRespect,
    orec: config.contracts.orec,
    providerUrl: config.providerUrl,
    tokenCfg: config.tokenMetadataCfg
  }, mordb);
}

export async function getOrnode() {
  try {
    return await ornode;
  } catch(err) {
    console.error(err);
    throw err;
  }
}