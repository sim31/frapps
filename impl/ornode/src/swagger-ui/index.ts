import express from "express";
import swaggerUi from 'swagger-ui-express';
import { Documentation } from "express-zod-api";
import { routing, config } from "../routes.js";
import fs from "fs";

const apiSpec = new Documentation({ routing, config, title: "Ornode", version: "3.0.0", serverUrl: "http://localhost:8090" });
const specObj = JSON.parse(apiSpec.getSpecAsJson());

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specObj));

app.listen(3000);

