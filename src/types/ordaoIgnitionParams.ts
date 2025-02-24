import { z } from "zod";
import { zOrdaoDeployment } from "./ordaoDeployment.js";
import { zOrdaoDeploymentCfg } from "./ordaoDeploymentCfg.js";
import { zEthAddress } from "@ordao/ortypes";

export const zOrdaoExisting = z.object({
  OrdaoExisting: zOrdaoDeployment,
});

export const zOrdaoNew = z.object({
  Orec: z.object({
    oldRespectAddr: zEthAddress,
    votePeriod: z.number(),
    vetoPeriod: z.number(),
    voteThreshold: z.number(),
    maxLiveYesVotes: z.number(),
  }),
  OrdaoNew: z.object({
    uri: z.string().url(),
    contractURI: z.string().url(),
  })
})
