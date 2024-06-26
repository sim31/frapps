import { IORNode } from "ortypes";
import { MongoOrnode } from "./mongoOrnode.js";
import { config } from "./config.js";

export let ornode: Promise<IORNode>;

export async function init() {
  // const ornode = MemOrnode.create({
  //   newRespect: config.contracts.newRespect,
  //   orec: config.contracts.orec,
  //   providerUrl: config.providerUrl
  // });

  ornode = MongoOrnode.create({
    newRespect: config.contracts.newRespect,
    orec: config.contracts.orec,
    providerUrl: config.providerUrl
  })
}

export async function getOrnode() {
  try {
    return await ornode;
  } catch(err) {
    console.error(err);
    throw err;
  }
}

