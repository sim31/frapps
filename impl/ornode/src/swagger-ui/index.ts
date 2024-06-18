import express from "express";
import swaggerUi from 'swagger-ui-express';
import { Documentation } from "express-zod-api";
import { routing } from "../routing.js";
import { ezConfig } from "../config.js";
import fs from "fs";

const apiSpec = new Documentation({ routing, config: ezConfig, title: "Ornode", version: "3.0.0", serverUrl: "http://localhost:8090" });
const specObj = JSON.parse(apiSpec.getSpecAsJson());

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specObj));

app.listen(3000);

