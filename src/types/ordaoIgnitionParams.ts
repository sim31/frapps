import { z } from "zod";
import { zOrdaoDeployment } from "./ordaoDeployment";
import { zOrdaoDeploymentCfg } from "./ordaoDeploymentCfg";

export const zOrdaoExisting = z.object({
  OrdaoExisting: zOrdaoDeployment,
});
