import { zProposal, Proposal } from "ortypes/ornode.js";
import { zProposalEntity } from "../entities.js";

export const zPropEntityToProp = zProposalEntity.transform((entity) => {
  const prop = {
    ...entity,
    _id: undefined
  };
  const nprop: Proposal = prop;
  return nprop;
}).pipe(zProposal);