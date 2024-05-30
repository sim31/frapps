import { Orec } from "orec/typechain-types/index.js";
import { EthAddress, PropId, zEthAddress, zMintRespectGroupArgs } from "./common.js";
import { IORNode, PropContext, Proposal, ProposalInContext, zPropContent, zProposal, zRespectBreakout } from "./ornodeTypes.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { z } from "zod";


export default class ORNodeMemImpl implements IORNode {
  // value might be undefined if proposal has been submitted onchain but not to us
  private _proposalMap: Record<PropId, Proposal> = {};
  private _propIndex: PropId[] = [];
  // Proposals which have been submitted to us but are not onchain yet
  private _propStaging: Record<PropId, Proposal> = {};

  private _ctx: PropContext;

  private constructor(propContext: PropContext) {
    this._ctx = propContext;
  }

  static async createIORNode(orec: Orec, newRespect: Respect1155): Promise<IORNode> {
    const newRespectAddr = zEthAddress.parse(await newRespect.getAddress());
    const oldRespectAddr = zEthAddress.parse(await orec.respectContract());
    const orecAddr = zEthAddress.parse(await orec.getAddress());

    return new ORNodeMemImpl({
      newRespectAddr,
      oldRespectAddr,
      orecAddr
    });
  }

  async toContext(prop: Proposal): ProposalInContext {
    const r: ProposalInContext = {
      ...this._ctx,
      prop
    }
    return r;
  }

  async putProposal(proposal: Proposal) {

  } 

  async getProposal(id: PropId): Promise<Proposal> {

  }

  async getProposals(from: number, limit: number): Promise<Proposal[]> {

  }

}