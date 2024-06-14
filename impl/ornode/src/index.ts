import { config, routing } from "./routes.js";
import { createServer } from "express-zod-api";

createServer(config, routing);