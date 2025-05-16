import { z } from "zod";
import { zBaseApp } from "./baseApp.js";
import { zRespectFungibleMt } from "@ordao/ortypes/respect1155.js"
import { zContractMetadata } from "@ordao/ortypes";

// TODO: @ordao import from ornode
export const zRespectMtCfg = z.object({
  award: z.object({
    name: z.string(),
    description: z.string().optional(),
    image: z.string().url().optional(),
  }),
  fungible: zRespectFungibleMt,
  contract: zContractMetadata
})
export type RespectMtCfg = z.infer<typeof zRespectMtCfg>;

export const zOrdaoApp = zBaseApp.extend({
  appId: z.literal("ordao"),
  startPeriodNum: z.number().int().gte(0),
  respect: zRespectMtCfg,
  parentRespectLink: z.string().url(),
  childRespectLink: z.string().url(),
  respectGameLink: z.string().url(),
  defaultPropQuerySize: z.coerce.number().int().gt(0).optional(),
  fractalDocsUrl: z.string().url().optional()
});
export type OrdaoApp = z.infer<typeof zOrdaoApp>;
