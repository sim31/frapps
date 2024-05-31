import { Orec, Orec__factory } from "orec/typechain-types/index.js";
import { EthAddress, PropId, isEthAddr, zEthAddress, zMintRespectGroupArgs } from "./common.js";
import { IORNode, Proposal, ProposalFull, ProposalNotFound, zProposal } from "./ornodeTypes.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { z } from "zod";
import { ORContext, Config as ORContextConfig } from "./orContext.js";
import { Respect1155__factory } from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import { FractalRespect } from "op-fractal-sc/typechain-types/contracts/FractalRespect.js";
import { FractalRespect__factory } from "op-fractal-sc/typechain-types/factories/contracts/FractalRespect__factory.js";

export interface ConstructorConfig {
  /**
   * For how long a proposal without weighted votes will be stored
   * @default: orec.votePeriod
   */
  weghtlessPropAliveness?: number
}

export interface Config extends ConstructorConfig{
  newRespect: EthAddress | Respect1155,
  orec: EthAddress | Orec
}

type ORNodeContextConfig = Omit<ORContextConfig, "ornode">;

export default class ORNodeMemImpl implements IORNode {
  // value might be null if proposal has been submitted onchain but not to us
  private _propMap: Record<PropId, ProposalFull> = {}
  private _propIndex: PropId[] = [];
  private _ctx: ORContext;
  private _cfg: ConstructorConfig;

  private constructor(contextCfg: ORNodeContextConfig, config: ConstructorConfig) {
    this._ctx = new ORContext({ ...contextCfg, ornode: this });
    this._cfg = config;
  }

  static async createIORNode(config: Config): Promise<IORNode> {
    const orec: Orec = isEthAddr(config.orec)
      ? Orec__factory.connect(config.orec)
      : config.orec;
    const newRespect = isEthAddr(config.newRespect)
      ? Respect1155__factory.connect(config.newRespect)
      : config.newRespect;
    const oldRespectAddr = await orec.respectContract();
    const oldRespect: FractalRespect = FractalRespect__factory.connect(oldRespectAddr);

    const ctx: ORNodeContextConfig = {
      orec, newRespect, oldRespect
    };

    const propAliveness = config.weghtlessPropAliveness ?? Number(await orec.voteLen());

    const cfg: ConstructorConfig = {
      weghtlessPropAliveness: propAliveness
    }

    return new ORNodeMemImpl(ctx, cfg);
  }
  
  // TODO:
  // * Listen for weighted vote events
  //   * If proposal exists in staging move it to _propMap

  // TODO: For config you only need orec address, timeout for clearing staging, API endpoint for Eth provider

  /**
   * Expecting that proposal is already validated against it's type
   */
  async putProposal(proposal: Proposal) {
    // TODO:
    // * Check if proposal already exists in prop map. If so store it there.
    // * Then check if proposal is created onchain. If so, create proposal in _propMap
    // * Otherwise store it in staging. Create a timer to delete it from staging if it is still there after a couple of days;
    //   * Timer to delete it after 10 minutes if proposal is not created by that time
    //   * Timer to delete it after vote_period if there are no weighted yes votes
        
  } 

  async getProposal(id: PropId): Promise<Proposal> {
    const val = this._propMap[id];
    if (val === undefined) {
      // TODO: check if proposal is created onchain. If so then return Proposal with unknown fields as undefined
      throw new ProposalNotFound(id);
    } else {
      z.literal(id).parse(val.id);
      return val;
    }
  }

  async getProposals(from: number, limit: number): Promise<Proposal[]> {
    const firstIndex = z.number().gte(0).parse(from);
    const l = z.number().gt(0).parse(limit);
    const lastIndex = from + limit < this._propIndex.length
      ? from + limit
      : this._propIndex.length - 1;
    
    const proposals = new Array<Proposal>();
    for (let i = firstIndex; i <= lastIndex; i++) {
      // Checks if proposal is stored
      const propId = this._propIndex[i];
      const prop = await this.getProposal(propId);
      proposals.push(prop);
    }

    return proposals;
  }

  async getPeriodNum(): Promise<number> {
    return 0;
  }

}