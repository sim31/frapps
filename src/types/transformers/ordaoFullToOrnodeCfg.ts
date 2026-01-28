import { zConfig as zOrnodeCfg, Config as OrnodeCfg } from "@ordao/ornode/dist/config.js";
import { zOrdaoFrappFull } from "../ordaoFrappDeployed.js";
import { z } from "zod";

export const zToOrnodeCfg = zOrdaoFrappFull.transform((val) => {
  const c: Omit<OrnodeCfg, "swaggerUI"> = {
    contracts: val.deployment,
    tokenMetadataCfg: val.app.respect,
    ornode: {
      ...val.localOnly.ornode,
      defBreakoutType: val.app.defBreakoutType
    },
    mongoCfg: val.localOnly.mongoCfg,
    providerUrl: val.localOnly.providerUrl
  }
  return c;
}).pipe(zOrnodeCfg as unknown as z.ZodTypeAny);
