import { stringify } from "ts-utils";
import { PropId } from "./orec.js";
import {
  ErrorType,
  ORNodePropStatus,
  Proposal,
  ProposalFull,
  zErrorType,
  GetTokenOpts,
  GetProposalsSpec,
} from "./ornode.js";
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
  getProposals: (spec: GetProposalsSpec) => Promise<Proposal[]>

  getPeriodNum: () => Promise<number>;

  /**
   * @param opts - options. default: { burned: true }
   */
  getToken: (tokenId: TokenId, opts?: GetTokenOpts) => Promise<RespectFungibleMt | RespectAwardMt>;

  // TODO: should have a function to get latest awards and getAwardsOf should return latest awards and should limit amount of awards returned.

  /**
   * @param opts - options. default: { burned: true }
   */
  getAward: (tokenId: TokenId, opts?: GetTokenOpts) => Promise<RespectAwardMt>;
  getRespectMetadata: () => Promise<RespectFungibleMt>;
  /**
   * @param opts - options. default: { burned: false }
   */
  getAwardsOf: (account: EthAddress, opts?: GetTokenOpts) => Promise<RespectAwardMt[]>;
}

export class ProposalNotFound extends Error {
  name: ErrorType = zErrorType.enum.ProposalNotFound;
  statusCode: number = 400

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
  statusCode: number = 400

  constructor(proposal: Proposal, cause: any) {
    const msg = `Proposal invalid. Proposal: ${stringify(proposal)}`;
    super(msg);
    this.cause = cause;
  } 
}

export class TokenNotFound extends Error {
  name: ErrorType = zErrorType.enum.TokenNotFound;
  statusCode: number = 404

  constructor(tokenId: TokenId) {
    const msg = `Token with id ${tokenId} does not exist`;
    super(msg);
  }
}
