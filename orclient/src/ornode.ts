import {
  Account,
  EthAddress,
  Stage,
  VoteStatus,
  VoteType,
  ExecStatus,
  TokenId,
  PropId,
  PropType
} from "./common.js";

export interface ProposalContent {
  address: string;
  cdata: string;
}

export interface Proposal {
  id: PropId;
  content?: ProposalContent;
  attachment?: PropAttachment;
}

export type PropAttachment = 
  RespectBreakoutAttachment | RespectAccountAttachment
  | BurnRespectAttachment | CustomSignalAttachment
  | TickAttachment
  | CustomCallAttachment;

export interface PropAttachmentBase {
  propType: PropType;
  propTitle?: string;
  propDescription?: string;
  salt?: string;
}

export interface RespectBreakoutAttachment extends PropAttachmentBase {
  propType: "respectBreakout"
}

export interface RespectAccountAttachment extends PropAttachmentBase {
  propType: "respectAccount";
  mintReason: string;
  mintTitle: string;
}

export interface BurnRespectAttachment extends PropAttachmentBase {
  propType: "burnRespect";
  burnReason: string;
}

export interface CustomSignalAttachment extends PropAttachmentBase {
  propType: "customSignal";
  link: string;
}

export interface TickAttachment extends PropAttachmentBase {
  propType: "tick";
  link?: string;
}

export interface CustomCallAttachment extends PropAttachmentBase {
  propType: "customCall";
}

export interface IORNode {
  putProposal: (proposal: Proposal) => Promise<void>;
  /**
   * Should return only proposals which have been submitted onchain
   */
  getProposal: (id: PropId) => Promise<Proposal>;
  getProposals: (from: number, limit: number) => Promise<Proposal[]>
}
