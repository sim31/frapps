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
  zPropType,
  zUint8,
  zProposedMsg,
  zBytesLikeToBytes
} from "./common.js";
import { z } from "zod";
import { Orec } from "orec/typechain-types/index.js";
import { solidityPackedKeccak256 } from "ethers";
import { propId } from "orec/utils/index.js";

export const zPropContent = zProposedMsg;
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
  burnReason: z.string()
});
export type BurnRespectAttachment = z.infer<typeof zBurnRespectAttachment>;

export const zCustomSignalAttachment = zPropAttachmentBase.extend({
  propType: z.literal(zPropType.Enum.customSignal),
  link: z.string().optional()
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

function propIdMatchesContent(prop: ProposalBaseFull): boolean {
  const pid = propId(prop.content);
  return prop.id === pid;
}

export type ZProposalType = 
    typeof zProposalBaseFull | typeof zRespectBreakout
    | typeof zRespectAccount | typeof zBurnRespect
    | typeof zCustomSignal | typeof zCustomCall
    | typeof zTick | typeof zProposalFull

function attachPropIdMatchesContent<T extends ZProposalType>(zType: T) {
  return zType.refine(propIdMatchesContent, { message: "proposal content does not match its id"});
}

function propMemoMatchesAttachment(prop: ProposalBaseFull) {
  const memo = zBytesLikeToBytes.parse(prop.content.memo); 
  return memo === attachmentId(prop.attachment);
}

function attachPropMemoMatchesAttachment<
  T extends ZProposalType | ReturnType<typeof attachPropIdMatchesContent>
  >(zType: T) {
  return zType.refine(propMemoMatchesAttachment, { message: "proposal memo does not match its attachment"});
}

function attachPropRefinements<T extends ZProposalType>(zType: T) {
  return attachPropMemoMatchesAttachment(attachPropIdMatchesContent(zType));
}

export const zProposalBase = z.object({
  id: zPropId,
  content: zPropContent.optional(),
  attachment: zPropAttachment.optional()
})
export type ProposalBase = z.infer<typeof zProposalBase>;

export const zProposalBaseFull = zProposalBase.required();
export type ProposalBaseFull = z.infer<typeof zProposalBaseFull>;

export const zProposalBaseFullValid = attachPropRefinements(zProposalBaseFull);

export const zRespectBreakout = zProposalBaseFull.extend({
  attachment: zRespectBreakoutAttachment
});
export type RespectBreakout = z.infer<typeof zRespectBreakout>;

export const zRespectBreakoutValid = attachPropRefinements(zRespectBreakout);

export const zRespectAccount = zProposalBaseFull.extend({
  attachment: zRespectAccountAttachment
})
export type RespectAccount = z.infer<typeof zRespectAccount>;

export const zRespectAccountValid = attachPropRefinements(zRespectAccount);

export const zBurnRespect = zProposalBaseFull.extend({
  attachment: zBurnRespectAttachment
});
export type BurnRespect = z.infer<typeof zBurnRespect>;

export const zBurnRespectValid = attachPropRefinements(zBurnRespect);

export const zCustomSignal = zProposalBaseFull.extend({
  attachment: zCustomSignalAttachment
});
export type CustomSignal = z.infer<typeof zCustomSignal>;

export const zCustomSignalValid = attachPropRefinements(zCustomSignal);

export const zCustomCall = zProposalBaseFull.extend({
  attachment: zCustomCallAttachment
});
export type CustomCall = z.infer<typeof zCustomCall>;

export const zCustomCallValid = attachPropRefinements(zCustomCall);

export const zTick = zProposalBaseFull.extend({
  attachment: zTickAttachment
});
export type Tick = z.infer<typeof zTick>;

export const zTickValid = attachPropRefinements(zTick);

export const zProposal = z.union([
  zProposalBase,
  zProposalBaseFull,
  zRespectBreakout,
  zRespectAccount,
  zBurnRespect,
  zCustomSignal,
  zTick,
  zCustomCall
]);
export type Proposal = z.infer<typeof zProposal>;

export const zProposalFull = z.union([
  zProposalBaseFull,
  zRespectBreakout,
  zRespectAccount,
  zBurnRespect,
  zCustomSignal,
  zTick,
  zCustomCall
]);
export type ProposalFull = z.infer<typeof zProposal>;

export const zProposalValid = attachPropRefinements(zProposalFull);

export interface IORNode {

  /**
   * Upload a content of a proposal, which is already created onchain.
   * 
   * ORNode checks if proposal with same id was created onchain, otherwise it throws ProposalNotCreated.
   * 
   */
  putProposal: (proposal: ProposalFull) => Promise<void>;
  /**
   * Should return only proposals which have been submitted onchain
   */
  getProposal: (id: PropId) => Promise<Proposal>;
  getProposals: (from: number, limit: number) => Promise<Proposal[]>

  getPeriodNum: () => Promise<number>;

}

export class ProposalNotFound extends Error {
  constructor(propId: PropId) {
    const msg = `Proposal with id ${propId} does not exist`;
    super(msg);
  }
}

export class ProposalNotCreated extends Error {
  constructor(proposal: Proposal) {
    const msg = `Proposal with id ${proposal.id} has not been created onchain yet. Proposal: ${JSON.stringify(proposal)}`;
    super(msg);
  }
}

export function idOfRespectBreakoutAttach(attachment: RespectBreakoutAttachment) {
  const a: Required<RespectBreakoutAttachment> = {
    ...attachment,
    propTitle: attachment.propTitle ?? "",
    propDescription: attachment.propDescription ?? "",
    salt: attachment.salt ?? ""
  };

  return solidityPackedKeccak256(
    [ "string", "string", "string", "string", "uint" ],
    [ a.propType, a.propTitle, a.propDescription, a.salt, a.groupNum ]
  );
}

export function idOfRespectAccountAttach(attachment: RespectAccountAttachment) {
  const a: Required<RespectAccountAttachment> = {
    ...attachment,
    propTitle: attachment.propTitle ?? "",
    propDescription: attachment.propDescription ?? "",
    salt: attachment.salt ?? ""
  };

  return solidityPackedKeccak256(
    [ "string", "string", "string", "string", "string", "string" ],
    [ a.propType, a.propTitle, a.propDescription, a.salt, a.mintReason, a.mintTitle ]
  );
}

export function idOfBurnRespectAttach(attachment: BurnRespectAttachment) {
  const a: Required<BurnRespectAttachment> = {
    ...attachment,
    propTitle: attachment.propTitle ?? "",
    propDescription: attachment.propDescription ?? "",
    salt: attachment.salt ?? ""
  };

  return solidityPackedKeccak256(
    [ "string", "string", "string", "string", "string" ],
    [ a.propType, a.propTitle, a.propDescription, a.salt, a.burnReason ]
  );
}

export function idOfCustomSignalAttach(attachment: CustomSignalAttachment | TickAttachment) {
  const a: Required<CustomSignalAttachment | TickAttachment> = {
    ...attachment,
    link: attachment.link ?? "",
    propTitle: attachment.propTitle ?? "",
    propDescription: attachment.propDescription ?? "",
    salt: attachment.salt ?? ""
  };

  return solidityPackedKeccak256(
    [ "string", "string", "string", "string", "string" ],
    [ a.propType, a.propTitle, a.propDescription, a.salt, a.link ]
  );
}

export function idOfCustomCallAttach(attachment: CustomCallAttachment) {
  const a: Required<CustomCallAttachment> = {
    ...attachment,
    propTitle: attachment.propTitle ?? "",
    propDescription: attachment.propDescription ?? "",
    salt: attachment.salt ?? ""
  };

  return solidityPackedKeccak256(
    [ "string", "string", "string", "string" ],
    [ a.propType, a.propTitle, a.propDescription, a.salt ]
  );
}

export function attachmentId(attachment: PropAttachment) {
  switch (attachment.propType) {
    case 'respectBreakout':
      return idOfRespectBreakoutAttach(attachment);
    case 'respectAccount':
      return idOfRespectAccountAttach(attachment);
    case 'burnRespect':
      return idOfBurnRespectAttach(attachment);
    case 'customSignal':
      return idOfCustomSignalAttach(attachment);
    case 'tick':
      return idOfCustomSignalAttach(attachment);
    case 'customCall':
      return idOfCustomCallAttach(attachment);
    default:
      const exhaustiveCheck: never = attachment;
      throw new Error('exhaustive check failed');
  }

}

