import { z } from "zod";
import { zOrdaoDeployment } from "./ordaoDeployment.js";
import { zOrdaoFrapp } from "./ordaoFrapp.js";
import { zOrdaoLocalCfg } from "./ordaoLocalCfg.js";

export const zOrdaoFrappDeployed = zOrdaoFrapp.extend({
  deployment: zOrdaoDeployment
});
export type OrdaoFrappDeployed = z.infer<typeof zOrdaoFrappDeployed>;

export const zOrdaoFrappFull = zOrdaoFrappDeployed.extend({
  localOnly: zOrdaoLocalCfg  
});
export type OrdaoFrappFull = z.infer<typeof zOrdaoFrappFull>;
