import { z } from "zod";
import { zBaseApp } from "./baseApp";
import { zRespectFungibleMt } from "@ordao/ortypes/respect1155.js"
import { zContractMetadata } from "@ordao/ortypes";

export const zRespectMtCfg = z.object({
  award: z.object({
    name: z.string(),
    description: z.string().optional(),
    image: z.string().url().optional(),
  }),
  fungible: zRespectFungibleMt,
  contract: zContractMetadata
})

export const zOrdaoApp = zBaseApp.extend({
  app: z.literal("ordao"),
  startPeriodNum: z.number().int().gte(0),
  respect: zRespectMtCfg
});
