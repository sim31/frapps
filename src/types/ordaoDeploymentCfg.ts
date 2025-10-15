import { z } from "zod";
import { zBaseDeploymentCfg } from "./baseDeploymentCfg.js";
import { zBytes, zEthAddress } from "@ordao/ortypes";
import { zRespectHolders } from "./respectHolders.js";
import { zOrdaoDeployment } from "./ordaoDeployment.js";

export const zBaseNewOrdaoDeploymentCfg = zBaseDeploymentCfg.extend({
  oldRespectAddr: zEthAddress,
  votePeriod: z.number(),
  vetoPeriod: z.number(),
  voteThreshold: z.number(),
  maxLiveYesVotes: z.number(),
  ornodeOrigin: z.string().url(),
});

export const zOrdaoExisting = zBaseDeploymentCfg.extend({
  module: z.literal("OrdaoExisting"),
  deployment: zOrdaoDeployment,
  ornodeOrigin: z.string().url().optional()
});

export const zOrdaoNew = zBaseNewOrdaoDeploymentCfg.extend({
  module: z.literal("OrdaoNew")
});

/**
 * Generalized
 */
export const zOrdaoDeploymentCfg = z.union([
  zOrdaoExisting,
  zOrdaoNew
]);

