import { z } from "zod";
import { zBaseFrapp } from "./baseFrapp.js";
import { zOrdaoDeploymentCfg } from "./ordaoDeploymentCfg.js";
import { zOrdaoApp } from "./ordaoApp.js";

export const zOrdaoFrapp = zBaseFrapp.extend({
  deploymentCfg: zOrdaoDeploymentCfg,
  app: zOrdaoApp
});
export type OrdaoFrapp = z.infer<typeof zOrdaoFrapp>;
