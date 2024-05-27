import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import {
  Account,
  EthAddress,
  Stage,
  VoteStatus,
  VoteType,
  ExecStatus,
  TokenId,
  PropId,
  PropType,
  zEthAddress,
  zBytes,
  zPropId,
  zPropType
} from "./common.js";
import { z } from "zod";
import { Orec } from "orec/typechain-types/index.js";

export const zPropContext = z.object({
  oldRespectAddr: zEthAddress,
  newRespectAddr: zEthAddress,
  orecAddr: zEthAddress
});

export const zPropContent = z.object({
  address: zEthAddress,
  cdata: zBytes
});
export type PropContent = z.infer<typeof zPropContent>;

export const zPropAttachmentBase = z.object({
  propType: zPropType,
  propTitle: z.string().optional(),
  propDescription: z.string().optional(),
  salt: z.string().optional(),
});
export type PropAttachmentBase = z.infer<typeof zPropAttachmentBase>;

export const zRespectBreakoutAttachment = zPropAttachmentBase.extend({
  propType: z.literal(zPropType.Enum.respectBreakout),
  groupNum: z.number().gt(0)
});
export type RespectBreakoutAttachment = z.infer<typeof zRespectBreakoutAttachment>;

export const zRespectAccountAttachment = zPropAttachmentBase.extend({
  propType: z.literal(zPropType.Enum.respectAccount),
  mintReason: z.string(),
  mintTitle: z.string()
});
export type RespectAccountAttachment = z.infer<typeof zRespectAccountAttachment>;

export const zBurnRespectAttachment = zPropAttachmentBase.extend({
  propType: z.literal(zPropType.Enum.burnRespect),
  burnReason: z.literal(zPropType.Enum.burnRespect)
});
export type BurnRespectAttachment = z.infer<typeof zBurnRespectAttachment>;

export const zCustomSignalAttachment = zPropAttachmentBase.extend({
  propType: z.literal(zPropType.Enum.customSignal),
  link: z.string()
})
export type CustomSignalAttachment = z.infer<typeof zCustomSignalAttachment>;

export const zTickAttachment = zPropAttachmentBase.extend({
  propType: z.literal(zPropType.Enum.tick),
  link: z.string().optional()
})
export type TickAttachment = z.infer<typeof zTickAttachment>;

export const zCustomCallAttachment = zPropAttachmentBase.extend({
  propType: z.literal(zPropType.Enum.customCall)
})
export type CustomCallAttachment = z.infer<typeof zCustomCallAttachment>;

export const zPropAttachment = z.union([
  zRespectBreakoutAttachment,
  zRespectAccountAttachment,
  zBurnRespectAttachment,
  zCustomSignalAttachment,
  zTickAttachment,
  zCustomCallAttachment
]);
export type PropAttachment = z.infer<typeof zPropAttachment>;

export const zProposal = z.object({
  id: zPropId,
  content: zPropContent,
  attachment: zPropAttachment
});
export type Proposal = z.infer<typeof zProposal>;

export const zProposalInContext = zPropContext.extend({
  prop: zProposal
});
export type ProposalInContext = z.infer<typeof zProposalInContext>;

export const zRespectBreakout = zProposal.extend({
  attachment: zRespectBreakoutAttachment
});
export type RespectBreakout = z.infer<typeof zRespectBreakout>;

export const zRespectAccount = zProposal.extend({
  attachment: zRespectAccountAttachment
})
export type RespectAccount = z.infer<typeof zRespectAccount>;

export const zBurnRespect = zProposal.extend({
  attachment: zBurnRespectAttachment
});
export type BurnRespect = z.infer<typeof zBurnRespect>;

export const zCustomSignal = zProposal.extend({
  attachment: zCustomSignalAttachment
});
export type CustomSignal = z.infer<typeof zCustomSignal>;

export const zCustomCall = zProposal.extend({
  attachment: zCustomCallAttachment
});
export type CustomCall = z.infer<typeof zCustomCall>;

export const zTick = zProposal.extend({
  attachment: zTickAttachment
});
export type Tick = z.infer<typeof zTick>;

export interface zProposalTypes {
  respectBreakout: typeof zRespectBreakout,
  respectAccount: typeof zRespectAccount,
  burnRespect: typeof zBurnRespect,
  CustomSignal: typeof zCustomSignal,
  Tick: typeof zTick,
  CustomCall: typeof zCustomCall
}

export interface IORNode {
  putProposal: (proposal: Proposal) => Promise<void>;
  /**
   * Should return only proposals which have been submitted onchain
   */
  getProposal: (id: PropId) => Promise<Proposal>;
  getProposals: (from: number, limit: number) => Promise<Proposal[]>

  getProposalTypes: () => zProposalTypes;
}
