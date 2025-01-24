import { z } from "zod";
import { zBaseFrapp } from "./baseFrapp";
import { zOrdaoDeploymentCfg } from "./ordaoDeploymentCfg";
import { zOrdaoApp } from "./ordaoApp";

export const zOrdaoFrapp = zBaseFrapp.extend({
  deploymentCfg: zOrdaoDeploymentCfg,
  app: zOrdaoApp
});
export type OrdaoFrapp = z.infer<typeof zOrdaoFrapp>;
