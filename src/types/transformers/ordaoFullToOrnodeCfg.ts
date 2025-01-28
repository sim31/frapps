import { zConfig as zOrnodeCfg, Config as OrnodeCfg, zSwaggerUICfg } from "@ordao/ornode/dist/config.js";
import { zOrdaoFrappFull } from "../ordaoFrappDeployed.js";

export const zToOrnodeCfg = zOrdaoFrappFull.transform((val) => {
  const c: Omit<OrnodeCfg, "swaggerUI"> = {
    contracts: val.deployment,
    tokenMetadataCfg: val.app.respect,
    ornode: val.localOnly.ornode,
    mongoCfg: val.localOnly.mongoCfg,
    providerUrl: val.localOnly.providerUrl
  }
  return c;
}).pipe(zOrnodeCfg);
