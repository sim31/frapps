import { Orec } from "orec/typechain-types/index.js";
import { EthAddress, PropId, zEthAddress, zMintRespectGroupArgs } from "./common.js";
import { IORNode, Proposal, zPropContent, zProposal, zProposalTypes, zRespectBreakout } from "./ornode.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { z } from "zod";


export default class ORNodeMemImpl implements IORNode {
  // value might be undefined if proposal has been submitted onchain but not to us
  private _proposalMap: Record<PropId, Proposal> = {};
  private _propIndex: PropId[] = [];
  // Proposals which have been submitted to us but are not onchain yet
  private _propStaging: Record<PropId, Proposal> = {};
  private _newRespectAddr: EthAddress;

  private _validatingPropTypes: zProposalTypes;

  private constructor(validatingPropTypes_: zProposalTypes, newRespectAddr: EthAddress) {
    this._validatingPropTypes = validatingPropTypes_;
    this._newRespectAddr = newRespectAddr;
  }

  static async createIORNode(orec: Orec, newRespect: Respect1155): Promise<IORNode> {
    const newRAddr = zEthAddress.parse(await newRespect.getAddress());

    const propTypes: zProposalTypes = {
      // TODO: test this way of checking the address
      respectBreakout: zRespectBreakout.setKey('content', zPropContent.extend({
        address: z.literal(newRAddr)
      }))
    }
    const rb = zRespectBreakout.refine(val => {
      return val.content.address === newRAddr;
    });

    const zRespectAccount = zProposal.extend({
      content
    })

    return new ORNodeMemImpl();
  }


  async putProposal(proposal: Proposal) {

  } 

  async getProposal(id: PropId): Promise<Proposal> {

  }

  async getProposals(from: number, limit: number): Promise<Proposal[]> {

  }

}