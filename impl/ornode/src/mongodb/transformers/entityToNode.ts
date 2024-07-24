import { zProposal, Proposal } from "ortypes/ornode.js";
import { zProposalEntity, zRespectAwardEntity } from "../entities.js";
import { RespectAwardMt, zRespectAwardMt } from "ortypes/respect1155.js";

export const zPropEntityToProp = zProposalEntity.transform((entity) => {
  const prop = {
    ...entity,
    _id: undefined
  };
  const nprop: Proposal = prop;
  return nprop;
}).pipe(zProposal);

export const zRAwardEntityToAward = zRespectAwardEntity.transform(entity => {
  const award = {
    ...entity,
    _id: undefined
  };
  const naward: RespectAwardMt = award;
  console.debug("zRAwrdEntityToAward ok");
  return naward;
}).pipe(zRespectAwardMt);
