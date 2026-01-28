// TODO: @ordao fix exports
import { zMongoConfig, zOrnodeCfg } from "@ordao/ornode/dist/config.js";
import { z } from "zod";

// Configuration needed for runtime environment, that you don't want to commit
export const zOrdaoLocalCfg = z.object({
  providerUrl: z.string().url(),
  mongoCfg: zMongoConfig as unknown as z.ZodTypeAny,
  ornode: zOrnodeCfg as unknown as z.ZodTypeAny,
  privyAppId: z.string()
})
