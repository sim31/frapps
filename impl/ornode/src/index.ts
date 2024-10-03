import { routing } from "./routing.js";
import { ezConfig, config } from "./config.js"
import { createServer } from "express-zod-api";
import { init } from "./mongoOrnode.js";
import "./client/index.js"; // writes client

export { Config, ContractsAddrs } from "./config.js";

const initPromise = init();

// Either sync or run ornode live,
// to reduce the likelyhood of resyncing
// (ornode should have different config for syncing).
if (config.ornode.sync === undefined) {
  console.log("Launching in normal mode");
  createServer(ezConfig, routing);
} else {
  initPromise.then(() => process.exit());
}

