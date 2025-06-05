import { zBaseFrapp } from "./baseFrapp.js";
import { zExternalApp } from "./externalApp.js";
import { z } from "zod";
// TODO: this should be defined elsewhere
import { zSubdomain } from "./ordaoFrapp.js";

export const zExternalFrapp = zBaseFrapp.extend({
  frappsSubdomains: z.array(zSubdomain).describe("Subdomains of this fractal. Must be unique. Empty string means fractal will take the place of the root domain."),
  app: zExternalApp
});
export type ExternalFrapp = z.infer<typeof zExternalFrapp>;