import { Provider as EthProvider } from "ethers";
import { Orec } from "orec/typechain-types/index.js";
import { EthAddress, OnchainProp, PropId, zExecStatus, zProposalState, zStage, zVoteStatus } from "./common.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { IORNode } from "./ornodeTypes.js";
import { FractalRespect } from "op-fractal-sc/typechain-types/contracts/FractalRespect.js";
import { expect } from 'chai';
// TODO: Probably won't work for browser builds.
// Figure out how to make it work for tests as well as browser
import { Signer } from "../node_modules/ethers/lib.commonjs/index.js";

export interface Config {
  orec: Orec,
  newRespect: Respect1155,
  oldRespect: FractalRespect,
  ornode: IORNode
}

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
    expect(await this._cfg.orec.respectContract()).to.be.equal(oldRespAddr);
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
      status: zExecStatus.parse(propState.status),
      stage,
      voteStatus,
    }

    return r;
  }
}