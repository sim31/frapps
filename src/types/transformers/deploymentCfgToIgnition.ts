import { zOrdaoDeploymentCfg } from "../ordaoDeploymentCfg.js";
import { zOrdaoExisting } from "../ordaoIgnitionParams.js";
import { zOrdaoExisting as zOrdaoExistingCfg } from "../ordaoDeploymentCfg.js";

export const zToOrdaoExistingParams = zOrdaoExistingCfg.transform((val) => {
  return zOrdaoExisting.parse({ OrdaoExisting: val.deployment });
}).pipe(zOrdaoExisting);

export const zToIgnitionParams = zOrdaoDeploymentCfg.transform((val) => {
  switch (val.module) {
    case "OrdaoExisting":
      return zToOrdaoExistingParams.parse(val);
    default:
      throw new Error(`Unimplemented module: ${val.module}`);
  }
})