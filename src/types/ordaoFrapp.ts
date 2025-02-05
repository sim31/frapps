import { z } from "zod";
import { zBaseFrapp } from "./baseFrapp.js";
import { zOrdaoDeploymentCfg } from "./ordaoDeploymentCfg.js";
import { zOrdaoApp } from "./ordaoApp.js";

// https://stackoverflow.com/questions/7930751/regexp-for-subdomain
export const zSubdomain = z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?$/);

export const zOrdaoFrapp = zBaseFrapp.extend({
  frappsSubdomains: z.array(zSubdomain).describe("Subdomains of this fractal. Must be unique. Empty string means fractal will take the place of the root domain."),
  deploymentCfg: zOrdaoDeploymentCfg,
  app: zOrdaoApp
});
export type OrdaoFrapp = z.infer<typeof zOrdaoFrapp>;
