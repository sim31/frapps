import { z } from "zod";
import { zBaseDeployment } from "./baseDeployment";
import { zBytes, zEthAddress } from "@ordao/ortypes";
import { zRespectHolders } from "./respectHolders";

export const zNewOrdaoBaseDeployment = zBaseDeployment.extend({
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

export const zOrdaoParentCreated = zNewOrdaoBaseDeployment.extend({
  module: z.literal("OrdaoParentCreated"),
  parent: zParentCreated
});

export const zOrdaoParentExists = zNewOrdaoBaseDeployment.extend({
  module: z.literal("OrdaoParentExists"),
  parent: zParentExists
});

export const zOrdaoParentOraclized = zNewOrdaoBaseDeployment.extend({
  module: z.literal("OrdaoParentOraclized"),
  parent: zParentOraclized
});

export const zOrdaoContracts = z.object({
  oldRespect: zEthAddress,
  newRespect: zEthAddress,
  orec: zEthAddress
});
export type OrdaoContracts = z.infer<typeof zOrdaoContracts>;

export const zOrdaoExisting = zBaseDeployment.extend({
  module: z.literal("OrdaoExisting"),
  contracts: zOrdaoContracts
});

export const zOrdaoDeployment = z.union([
  zOrdaoParentCreated,
  zOrdaoParentExists,
  zOrdaoParentOraclized,
  zOrdaoExisting
]);

