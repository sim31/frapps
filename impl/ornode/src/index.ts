import { routing } from "./routing.js";
import { ezConfig } from "./config.js"
import { createServer } from "express-zod-api";

export { Config, ContractsAddrs } from "./config.js";

createServer(ezConfig, routing);
