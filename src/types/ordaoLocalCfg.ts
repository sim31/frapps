// TODO: @ordao fix exports
import { zMongoConfig, zOrnodeCfg } from "@ordao/ornode/dist/config.js";
import { z } from "zod";
import { zOrdaoFrapp } from "./ordaoFrapp.js";
import { zOrdaoDeployment } from "./ordaoDeployment.js";

// Configuration needed for runtime environment, that you don't want to commit
export const zOrdaoLocalCfg = z.object({
  providerUrl: z.string().url(),
  mongoCfg: zMongoConfig,
  ornode: zOrnodeCfg,
})
