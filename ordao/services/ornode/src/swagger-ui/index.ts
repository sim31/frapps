import express from "express";
import swaggerUi from 'swagger-ui-express';
import { Documentation } from "express-zod-api";
import { routing } from "../routing.js";
import { ezConfig, config } from "../config.js";
import fs from "fs";

// TODO: make server URL configurable
const apiSpec = new Documentation({
  routing,
  config: ezConfig,
  title: "Ornode",
  version: "1.2.3",
  serverUrl: config.swaggerUI.ornodeEndpoint
});
const specObj = JSON.parse(apiSpec.getSpecAsJson());

const app = express();

app.use('/', swaggerUi.serve, swaggerUi.setup(specObj));

app.listen(config.swaggerUI.port, config.swaggerUI.host);

