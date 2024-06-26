import { routing } from "./routing.js";
import { ezConfig } from "./config.js"
import { createServer } from "express-zod-api";
import { init } from "./ornode.js";
import "./client/index.js"; // writes client

export { Config, ContractsAddrs } from "./config.js";

init();

createServer(ezConfig, routing);

