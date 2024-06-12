import { Provider as EthProvider, Result, Signer } from "ethers";
import { Orec } from "orec-tc/index.js";
import { EthAddress } from "./eth.js";
import { IORNode } from "./iornode.js";
import { FractalRespect } from "op-fractal-sc/dist/typechain-types/index.js";
import { Contract as Respect1155 } from "./respect1155.js";
import { z } from "zod";
import { OnchainProp, PropId, zProposalState, zStage, zVoteStatus } from "./orec.js";

export interface Config {
  orec: Orec,
  newRespect: Respect1155,
  oldRespect: FractalRespect,
  ornode: IORNode
}

// TODO: async function to create context from addresses or passed contracts
// First base context with only respect contract and orec.
// Then extended class with old respect as well
// ORNode should accept this context through constructor
// See current ornodeMemImpl for how to create contracts from addresses

export class ORContext {
  private _cfg: Config;
  private _oldRespectAddr?: EthAddress;
  private _newRespectAddr?: EthAddress;
  private _orecAddr?: EthAddress;

  constructor(cfg: Config) {
    this._cfg = cfg;
    this.validate();
  }

  async validate() {
    const oldRespAddr = await this._cfg.oldRespect.getAddress();
    z.literal(await this._cfg.orec.respectContract()).parse(oldRespAddr);
    // TODO: check connections?
  }

  switchSigner(signer: Signer) {
    this._cfg.orec = this._cfg.orec.connect(signer);
  }

  get config(): Config {
    return this._cfg;
  }

  get orec(): Orec {
    return this._cfg.orec;
  }

  get newRespect(): Respect1155 {
    return this._cfg.newRespect;
  } 

  get ornode(): IORNode {
    return this._cfg.ornode;
  }

  get oldRespect(): FractalRespect {
    return this._cfg.oldRespect;
  }

  async getOrecAddr(): Promise<EthAddress> {
    if (this._orecAddr === undefined) {
      this._orecAddr = await this._cfg.orec.getAddress();
    }
    return this._orecAddr;
  }

  async getOldRespectAddr(): Promise<EthAddress> {
    if (this._oldRespectAddr === undefined) {
      this._oldRespectAddr = await this._cfg.oldRespect.getAddress();
    }
    return this._oldRespectAddr;
  }

  async getNewRespectAddr(): Promise<EthAddress> {
    if (this._newRespectAddr === undefined) {
      this._newRespectAddr = await this._cfg.newRespect.getAddress();
    }
    return this._newRespectAddr;
  }

  async getProposalFromChain(id: PropId): Promise<OnchainProp> {
    const propState = zProposalState.parse(await this._cfg.orec.proposals(id));
    const stage = zStage.parse(await this._cfg.orec.getStage(id));
    const voteStatus = zVoteStatus.parse(await this._cfg.orec.getVoteStatus(id));

    const r: OnchainProp = {
      id: id,
      createTime: new Date(Number(propState.createTime) * 1000),
      yesWeight: propState.yesWeight,
      noWeight: propState.noWeight,
      status: propState.status,
      stage,
      voteStatus,
    }

    return r;
  }
}