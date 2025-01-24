import { zOrdaoDeploymentCfg } from "../ordaoDeploymentCfg";
import { zOrdaoExisting } from "../ordaoIgnitionParams";
import { zOrdaoExisting as zOrdaoExistingCfg } from "../ordaoDeploymentCfg";

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