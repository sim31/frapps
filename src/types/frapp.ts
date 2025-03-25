import { z } from "zod";
import { zOrdaoFrapp } from "./ordaoFrapp.js";
import { zExternalFrapp } from "./externalFrapp.js";

export const zFrapp = z.union([
  zOrdaoFrapp,
  zExternalFrapp
]);
export type Frapp = z.infer<typeof zFrapp>;

