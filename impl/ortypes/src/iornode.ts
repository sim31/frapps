import { stringify } from "ts-utils";
import { PropId } from "./orec.js";
import { ErrorType, ORNodePropStatus, Proposal, ProposalFull, zErrorType } from "./ornode.js";
import { RespectAwardMt, RespectFungibleMt } from "./respect1155.js";
import { Erc1155Mt, TokenId } from "./erc1155.js";
import { EthAddress } from "./eth.js";

export interface IORNode {
  /**
   * Upload a content of a proposal, which is already created onchain.
   * 
   * ORNode checks if proposal with same id was created onchain, otherwise it throws ProposalNotCreated.
   * 
   */
  putProposal: (proposal: ProposalFull) => Promise<ORNodePropStatus>;
  /**
   * Should return only proposals which have been submitted onchain
   */
  getProposal: (id: PropId) => Promise<Proposal>;
  getProposals: (from: number, limit: number) => Promise<Proposal[]>

  getPeriodNum: () => Promise<number>;

  getToken: (tokenId: TokenId) => Promise<Erc1155Mt>;
  getAward: (tokenId: TokenId) => Promise<RespectAwardMt>;
  getRespectMetadata: () => Promise<RespectFungibleMt>;
  getAwardsOf: (account: EthAddress) => Promise<RespectAwardMt[]>;
}

export class ProposalNotFound extends Error {
  name: ErrorType = zErrorType.enum.ProposalNotFound;

  constructor(propId: PropId) {
    const msg = `Proposal with id ${propId} does not exist`;
    super(msg);
  }
}

export class ProposalNotCreated extends Error {
  name: ErrorType = zErrorType.enum.ProposalNotCreated;
  constructor(proposal: Proposal) {
    const msg = `Proposal with id ${proposal.id} has not been created onchain yet. Proposal: ${stringify(proposal)}`;
    super(msg);
  }
}

export class ProposalInvalid extends Error {
  name: ErrorType = zErrorType.enum.ProposalNotCreated;
  cause: string;

  constructor(proposal: Proposal, cause: any) {
    const msg = `Proposal invalid. Proposal: ${stringify(proposal)}`;
    super(msg);
    this.cause = cause;
  } 
}

export class TokenNotFound extends Error {
  name: ErrorType = zErrorType.enum.ProposalNotFound;

  constructor(tokenId: TokenId) {
    const msg = `Token with id ${tokenId} does not exist`;
    super(msg);
  }
}
