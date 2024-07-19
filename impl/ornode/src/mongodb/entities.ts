import { z } from "zod";
import { ProposalBase, zProposalBase } from "ortypes/ornode.js";
import { zPropId, zTimestamp, zTxHash } from "ortypes";
import { ObjectId } from "mongodb";
import { zRespectAwardMt } from "ortypes/respect1155.js";

export const zMongodbEntity = z.object({
  _id: z.instanceof(ObjectId)
});

export const zProposalEntity = zMongodbEntity.merge(zProposalBase.required({
  createTs: true,
}))
export type ProposalEntity = z.infer<typeof zProposalEntity>;

export const zTickEvent = z.object({
  txHash: zTxHash.optional().describe("Hash of transaction which executed the tick")
})
export type TickEvent = z.infer<typeof zTickEvent>;

export const zTickEntity = zMongodbEntity.merge(zTickEvent);
export type TickEntity = z.infer<typeof zTickEntity>;

export const zRespectAwardEntity = zMongodbEntity.merge(zRespectAwardMt);
export type RespectAwardEntity = z.infer<typeof zRespectAwardEntity>;

