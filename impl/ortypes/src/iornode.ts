import { PropId } from "./orec.js";
import { ORNodePropStatus, Proposal, ProposalFull } from "./ornode.js";

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

export class ProposalInvalid extends Error {
  public cause: string;

  constructor(proposal: Proposal, cause: any) {
    const msg = `Proposal invalid. Proposal: ${JSON.stringify(proposal)}`;
    super(msg);
    this.cause = cause;
  } 
}