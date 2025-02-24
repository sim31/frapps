import { zOrdaoExisting, zOrdaoNew } from "../ordaoIgnitionParams.js";
import {
  zOrdaoDeploymentCfg,
  zOrdaoExisting as zOrdaoExistingCfg,
  zOrdaoNew as zOrdaoNewCfg
} from "../ordaoDeploymentCfg.js";

export const zToOrdaoExistingParams = zOrdaoExistingCfg.transform((val) => {
  return zOrdaoExisting.parse({ OrdaoExisting: val.deployment });
}).pipe(zOrdaoExisting);

export const zToOrdaoNewParams = zOrdaoNewCfg.transform((val) => {
  return zOrdaoNew.parse({
    Orec: {
      oldRespectAddr: val.oldRespectAddr,
      votePeriod: val.votePeriod,
      vetoPeriod: val.vetoPeriod,
      voteThreshold: val.voteThreshold,
      maxLiveYesVotes: val.maxLiveYesVotes
    },
    OrdaoNew: {
      uri: `${val.ornodeOrigin}/v1/token/{id}`,
      contractURI: `${val.ornodeOrigin}/v1/respectContractMetadata`
    }
  })
}).pipe(zOrdaoNew);

export const zToIgnitionParams = zOrdaoDeploymentCfg.transform((val) => {
  switch (val.module) {
    case "OrdaoExisting":
      return zToOrdaoExistingParams.parse(val);
    case "OrdaoNew": {
      return zToOrdaoNewParams.parse(val);
    }
    default:
      const n: never = val;
  }
})