import { z } from "zod";
import { OrdaoFrapp, zOrdaoFrapp } from "./ordaoFrapp.js";
import { ExternalFrapp, zExternalFrapp } from "./externalFrapp.js";

export const zFrapp = z.union([zOrdaoFrapp, zExternalFrapp]);
export type Frapp = OrdaoFrapp | ExternalFrapp;
