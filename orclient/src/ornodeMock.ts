import { PropId } from "./common.js";
import { IORNode, Proposal } from "./ornode.js";

export default class ORNodeMock implements IORNode {
  // value might be undefined if proposal has been submitted onchain but not to us
  private proposalMap: Record<PropId, Proposal> = {};
  private propIndex: PropId[] = [];
  // Proposals which have been submitted to us but are not onchain yet
  private propStaging: Record<PropId, Proposal> = {};

  async putProposal(proposal: Proposal) {

  } 

  async getProposal(id: PropId): Promise<Proposal> {

  }

  async getProposals(from: number, limit: number): Promise<Proposal[]> {

  }

}