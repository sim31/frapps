import { Orec, Orec__factory } from "orec/typechain-types/index.js";
import { EthAddress, PropId, isEthAddr, zBytesLikeToBytes, zEthAddress, zMintRespectGroupArgs, zSignalType, zTickSignalType } from "./common.js";
import { IORNode, ORNodePropStatus, Proposal, ProposalFull, ProposalInvalid, ProposalNotCreated, ProposalNotFound, ProposalValid, zORNodePropStatus, zProposal, zProposalValid } from "./ornodeTypes.js";
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

/**
 * TODO: Currently this class only saves proposals which are created onchain after
 * it starts running. This means that it will miss any proposals that happened before
 * ORNode was launched.
 * TODO: Should save proposals to storage so that ORNode could be restarted
 * TODO: Would be good to have a method to delete proposals which dot get any
 * weighted votes during voteTime, to save resources against spam.
 * TODO: Function to get signal data
 */
export default class ORNodeMemImpl implements IORNode {
  // value might be null if proposal has been submitted onchain but not to us
  private _propMap: SafeRecord<PropId, Proposal> = {}
  private _propIndex: PropId[] = [];
  private _periodNum: number = 0;
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

    const ornode = new ORNodeMemImpl(ctx, cfg);

    orec.on(orec.getEvent("ProposalCreated"), (propId) => {
      ornode._storeNewProposal(propId);
    });

    orec.on(orec.getEvent("Signal"), (signalType, data) => {
      const st = zSignalType.parse(signalType);
      if (st === zTickSignalType.value) {
        ornode._onTickSignal(data);
      } else {
        ornode._onSignal(st, data);
      }
    });

    return ornode
  }

  private _storeNewProposal(propId: PropId) {
    expect(this._propMap[propId]).to.be.undefined;
    this._propMap[propId] = { id: propId };
    this._propIndex.push(propId);
    console.log(`Storing new proposal ${propId}. Index: ${this._propIndex.length - 1}`);
  }

  private _onTickSignal(data: string) {
    this._periodNum += 1;
    console.log(`Tick. Data: ${data}`);
  }

  private _onSignal(signalType: number, data: string) {
    console.log(`Signal! Type: ${signalType}, data: ${data}`);
  }

  async putProposal(proposal: ProposalFull): Promise<ORNodePropStatus> {
    let propValid: ProposalValid;
    try {
      propValid = zProposalValid.parse(proposal);
    } catch (err) {
      throw new ProposalInvalid(proposal, err);
    }

    const exProp = this._propMap[proposal.id];
    if (exProp === undefined) {
      throw new ProposalNotCreated(proposal);
    }
    expect(exProp.id).to.be.equal(proposal.id);

    if (exProp.content !== undefined) {
      zProposalValid.parse(exProp);
      // If both proposals are valid and their id member is the same it means that proposals are equal
      // Return status saying that proposal already exists.
      return zORNodePropStatus.Enum.ProposalExists;
    } else {
      this._propMap[proposal.id] = propValid;
      return zORNodePropStatus.Enum.ProposalStored;
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
      const prop = zProposal.parse(this._propMap[propId]);
      proposals.push(prop);
    }

    return proposals;
  }

  // TODO:
  async getPeriodNum(): Promise<number> {
    return this._periodNum;
  }

}