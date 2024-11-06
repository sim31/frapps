import { routing } from "./routing.js";
import { ezConfig, config } from "./config.js"
import { createServer } from "express-zod-api";
import { getOrnode, init } from "./mongoOrnode.js";
import "./client/index.js"; // writes client
import { ORNode } from "./ornode.js";

export { Config, ContractsAddrs } from "./config.js";

async function start() {
  await init();
  // Either sync or run ornode live,
  // to reduce the likelehood of resyncing
  // (ornode should have different config for syncing).
  if (config.ornode.sync === undefined) {
    console.log("Launching in normal mode");
    createServer(ezConfig, routing);
  } else {
    const ornode = (await getOrnode()) as ORNode;
    await ornode.sync(config.ornode.sync);
    process.exit();
  }
}

start();

