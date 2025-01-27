import { z } from "zod";
import { zOrdaoDeployment } from "./ordaoDeployment.js";
import { zOrdaoDeploymentCfg } from "./ordaoDeploymentCfg.js";

export const zOrdaoExisting = z.object({
  OrdaoExisting: zOrdaoDeployment,
});
