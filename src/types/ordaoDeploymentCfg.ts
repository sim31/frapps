import { z } from "zod";
import { zBaseDeploymentCfg } from "./baseDeploymentCfg.js";
import { zBytes, zEthAddress } from "@ordao/ortypes";
import { zRespectHolders } from "./respectHolders.js";
import { zOrdaoDeployment } from "./ordaoDeployment.js";

export const zBaseNewOrdaoDeploymentCfg = zBaseDeploymentCfg.extend({
  voteLength: z.number(),
  vetoLength: z.number(),
  voteThreshold: z.number(),
  maxLiveYesVotes: z.number(),
  ornodeOrigin: z.string().url(),
});

/**
 * Modules:
 * * Parent respect deployed and issued, owner set to 0 (e.g.: buildium) (OrdaoParentCreated)
 * * Parent respect already exists (e.g.: ZAO, OF, OH, op-sepolia) (OrdaoParentExists)
 * * Parent respect deployed and issued, owner set to orec (so that orec is an oracle for respect of parent) (e.g.: EF) (OrdaoParentOraclized)
 * * ORDAO already has onchain deployment (OrdaoExisting)
 */

/**
 ******* Parent configs ******************
 */
export const zParentCreated = z.object({
  uri: z.string().url(),
  contractURI: z.string().url(),
  respectHolders: zRespectHolders,
  mintData: zBytes.optional(),
});

export const zParentExists = z.object({
  address: zEthAddress
});

export const zParentOraclized = z.object({
  uri: z.string().url(),
  contractURI: z.string().url(),
  respectHolders: zRespectHolders,
  mintData: zBytes.optional(),
});

/**
 * ***** full ORDAO configs****************
 * */
export const zOrdaoParentCreated = zBaseNewOrdaoDeploymentCfg.extend({
  module: z.literal("OrdaoParentCreated"),
  parent: zParentCreated
});

export const zOrdaoParentExists = zBaseNewOrdaoDeploymentCfg.extend({
  module: z.literal("OrdaoParentExists"),
  parent: zParentExists
});

export const zOrdaoParentOraclized = zBaseNewOrdaoDeploymentCfg.extend({
  module: z.literal("OrdaoParentOraclized"),
  parent: zParentOraclized
});

export const zOrdaoExisting = zBaseDeploymentCfg.extend({
  module: z.literal("OrdaoExisting"),
  deployment: zOrdaoDeployment
});

/**
 * Generalized
 */
export const zOrdaoDeploymentCfg = z.union([
  zOrdaoParentCreated,
  zOrdaoParentExists,
  zOrdaoParentOraclized,
  zOrdaoExisting
]);

