import { z } from "zod";
import { zOrdaoFrapp } from "./ordaoFrapp.js";
import { zExternalApp } from "./externalApp.js";

export const zFrapp = z.union([
  zOrdaoFrapp,
  zExternalApp
]);
export type Frapp = z.infer<typeof zFrapp>;


