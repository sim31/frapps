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
  // TODO: issue - I'm storing fields with value - undefined and on retrieval they are made to null
  // https://devblog.me/wtf-mongo
  // Maybe do this before inserting? https://stackoverflow.com/questions/25421233/javascript-removing-undefined-fields-from-an-object
  const award = {
    ...entity,
    _id: undefined
  };
  const naward: RespectAwardMt = award;
  return naward;
}).pipe(zRespectAwardMt);
