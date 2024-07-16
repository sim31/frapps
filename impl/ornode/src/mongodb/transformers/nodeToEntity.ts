import { zProposal } from "ortypes/ornode.js";
import { zProposalEntity, ProposalEntity, zTickEntity, TickEntity, zTickEvent } from "../entities.js";
import { ObjectId } from "mongodb";
import { addCustomIssue } from "ortypes";
import { z } from "zod";

export const zProposalToEntity = zProposal.transform((prop, ctx) => {
  if (prop.createTs === undefined) {
    addCustomIssue(prop, ctx, "createTs has to be defined to transform proposal to proposal entity");
    return z.NEVER;
  }
  const entity: ProposalEntity = {
    ...prop,
    createTs: prop.createTs,
    _id: new ObjectId()
  }
  return entity;

}).pipe(zProposalEntity);

export const zTickToEntity = zTickEvent.transform((tick, ctx) => {
  const entity: TickEntity = {
    ...tick,
    _id: new ObjectId()
  }
  return entity;
}).pipe(zTickEntity);
