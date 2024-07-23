import { zProposal } from "ortypes/ornode.js";
import { zProposalEntity, ProposalEntity, zTickEntity, TickEntity, zTickEvent, RespectAwardEntity, zRespectAwardEntity } from "../entities.js";
import { ObjectId } from "mongodb";
import { addCustomIssue } from "ortypes";
import { z } from "zod";
import { zRespectAwardMt } from "ortypes/respect1155.js";
import { stringify, withoutUndefined } from "ts-utils";

export const zProposalToEntity = zProposal.transform((prop, ctx) => {
  if (prop.createTs === undefined) {
    addCustomIssue(prop, ctx, "createTs has to be defined to transform proposal to proposal entity");
    return z.NEVER;
  }
  const entity: ProposalEntity = {
    ...withoutUndefined(prop),
    createTs: prop.createTs,
    _id: new ObjectId()
  }
  // This is needed because if you insert object with undefined set for some field,
  // you will get back null for that field once you retrieve the object.
  // That will fail Zod parsing...
  // https://devblog.me/wtf-mongo
  return entity;
}).pipe(zProposalEntity);

export const zTickToEntity = zTickEvent.transform((tick, ctx) => {
  const entity: TickEntity = {
    ...withoutUndefined(tick),
    _id: new ObjectId()
  }
  return entity;
}).pipe(zTickEntity);

export const zRespectAwardToEntity = zRespectAwardMt.transform(award => {
  const entity: RespectAwardEntity = {
    ...withoutUndefined(award),
    _id: new ObjectId()
  };
  return entity;
}).pipe(zRespectAwardEntity);
