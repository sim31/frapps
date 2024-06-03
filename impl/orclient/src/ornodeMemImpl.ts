import { Orec, Orec__factory } from "orec/typechain-types/index.js";
import { EthAddress, PropId, isEthAddr, zEthAddress, zMintRespectGroupArgs } from "./common.js";
import { IORNode, Proposal, ProposalFull, ProposalNotCreated, ProposalNotFound, zProposal } from "./ornodeTypes.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { z } from "zod";
import { ORContext, Config as ORContextConfig } from "./orContext.js";
import { Respect1155__factory } from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import { FractalRespect } from "op-fractal-sc/typechain-types/contracts/FractalRespect.js";
import { FractalRespect__factory } from "op-fractal-sc/typechain-types/factories/contracts/FractalRespect__factory.js";
import { SafeRecord } from "./ts-utils.js";
import { expect } from 'chai';

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
  private _propMap: SafeRecord<PropId, Proposal> = {}
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
  
  async putProposal(proposal: ProposalFull) {
    const exProp = this._propMap[proposal.id];
    if (exProp === undefined) {
      throw new ProposalNotCreated(proposal);
    }

    if (exProp.content !== undefined) {
      expect(exProp.content).to.deep.equal(proposal.content);
      expect()
    }

    if (exProp.content === undefined) {
      exProp.content = proposal.
    }
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

  // TODO:
  async getPeriodNum(): Promise<number> {
    return 0;
  }

}