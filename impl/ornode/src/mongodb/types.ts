import { z } from "zod";
import { ProposalBase, zProposalBase } from "ortypes/ornode.js";
import { zPropId, zTimestamp, zTxHash } from "ortypes";
import { ObjectId } from "mongodb";

export const zMongodbEntity = z.object({
  _id: z.instanceof(ObjectId)
});

export const zProposalEntity = zMongodbEntity.merge(zProposalBase.extend({
  _id: z.instanceof(ObjectId),
  createTs: zTimestamp.describe("Unix timestamp. Should match onchain createTime of proposal"),
  createTxHash: zTxHash.optional().describe("Hash of transaction which created this proposal"),
  executeTxHash: zTxHash.optional().describe("Hash of transaction which executed this proposal")
}))
export type ProposalEntity = z.infer<typeof zProposalEntity>;

export const zProposalDTO = zProposalEntity.partial({ _id: true })
export type ProposalDTO = z.infer<typeof zProposalDTO>;

export const zTickEntity = zMongodbEntity.extend({
  _id: z.instanceof(ObjectId),
  txHash: zTxHash.optional().describe("Hash of transaction which executed the tick")
});
export type TickEntity = z.infer<typeof zTickEntity>;

export const zTickDTO = zTickEntity.partial({ _id: true });
export type TickDTO = z.infer<typeof zTickDTO>;

function _tickEntityToDTO(entity: TickEntity): TickDTO {
  const cleanTick = {
    ...entity,
    _id: undefined
  }
  const dto: TickDTO = cleanTick;
  return dto;
}

export const zTickEntityToDTO = zTickEntity.transform((entity, ctx) => {
  return _tickEntityToDTO(entity);
}).pipe(zTickDTO);

export const zTickDTOToEntity = zTickDTO.transform((dto, ctx) => {
  const r: TickEntity = {
    ...dto,
    _id: new ObjectId()
  };
  return r;
}).pipe(zTickEntity);


function _propEntityToDTO(propEntity: ProposalEntity): ProposalDTO {
  const cleanProp = {
    ...propEntity,
    _id: undefined,
  };
  const nprop: ProposalDTO = cleanProp;

  return nprop;
}

export const zProposalEntityToDTO = zProposalEntity.transform((entity, ctx) => {
  return _propEntityToDTO(entity);
}).pipe(zProposalDTO);

export const zProposalEntityToProposal = zProposalEntity.transform((entity, ctx) => {
  const dto = _propEntityToDTO(entity); 
  const nprop: ProposalBase = dto;

  return nprop;
}).pipe(zProposalBase);

export const zPropDTOToEntity = zProposalDTO.transform((dto, ctx) => {
  const r: ProposalEntity = {
    ...dto,
    _id: new ObjectId()
  };
  return r;
}).pipe(zProposalEntity)

