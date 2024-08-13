import { ContractRunner, Provider as EthProvider, JsonRpcProvider, Provider, Result, Signer } from "ethers";
import { OrecContract as Orec, OrecFactory } from "./orec.js";
import { EthAddress, isEthAddr, zEthNonZeroAddress } from "./eth.js";
import { IORNode } from "./iornode.js";
import { Contract as FractalRespect, Factory as FractalRespectFactory } from "./fractalRespect.js";
import { Contract as Respect1155, Factory as Respect1155Factory } from "./respect1155.js";
import { z } from "zod";
import { OnchainProp, PropId, zProposalState, zStage, zVoteStatus } from "./orec.js";
import { InvalidArgumentError, Url, zUrl } from "./common.js";
import { Required } from "utility-types";
import { expect } from "chai";
import { testVersion } from "orec/utils";
import { ErrorDecoder, DecodedError } from 'ethers-decode-error'

export class OnchainPropNotFound extends Error {
  name: string = "OnchainPropNotFound"

  constructor(propId: PropId) {
    const msg = `Proposal with id ${propId} does not exist`;
    super(msg);
  }
}


export interface State {
  orec: Orec,
  newRespect: Respect1155,
  oldRespect: FractalRespect,
  ornode?: IORNode
}

// export type StateWithOrnode = Required<State, 'ornode'>
export interface StateWithOrnode extends State {
  ornode: IORNode;
}

export interface Config {
  orec: EthAddress | Orec,
  newRespect: EthAddress | Respect1155,
  ornode?: IORNode,
  contractRunner?: ContractRunner | Url
}

export interface ConfigWithOrnode extends Config {
  ornode: IORNode
}

// export type ConfigWithOrnode = Required<Config, 'ornode'>;

export type StateForConfig<CT extends Config> =
  CT extends ConfigWithOrnode ? StateWithOrnode : State;

/**
 * Class for holding context for ORDAO (smart contract, urls, addresses composing the ORDAO system).
 */
export class ORContext<CT extends Config> {
  private _st: StateForConfig<CT>;
  private _oldRespectAddr?: EthAddress;
  private _newRespectAddr?: EthAddress;
  private _orecAddr?: EthAddress;
  private _runner: ContractRunner;
  private _errDecoder: ErrorDecoder;

  constructor(
    state: StateForConfig<CT>,
    runner: ContractRunner,
    validate: boolean = true
  ) {
    this._st = state;
    this._runner = runner;

    this._errDecoder = ErrorDecoder.create([
      // TODO: this function accepts interfaces, so you should not need to copy fragments
      // But for some reason it does not work (throws r.filter is not a function). I think it is this line:
      // https://github.com/superical/ethers-decode-error/blob/5ba3ce49bcb5cd2824fc25014a00cd1e4f96ede1/src/error-decoder.ts#L116
      // `instanceof` check fails because interface is being created by a different constructor function than ErrorDecoder uses.
      // There's a problem with ethers / typechain commonjs vs ESM versions.
      // Maybe I have a commonjs version of interface created by hardhat
      // and ErrorDecoder is expecting esm?
      new Array(...state.orec.interface.fragments),
      new Array(...state.newRespect.interface.fragments),
    ]);

    if (validate) {
      this.validate();
    }
  }

  async validate() {
    // Check if orec is responsive
    const oldRespAddr = await this.getOldRespectAddr();
    // Check if respect address in orec matches passed oldRespectAddr
    z.literal(await this._st.orec.respectContract()).parse(oldRespAddr);
    // Check if new Respect is responsive
    const owner = await this._st.newRespect.owner();
    // Check if owner of newRespect is Orec
    const orecAddr = await this.getOrecAddr();
    expect(orecAddr).to.be.equal(owner);
    // Check oldRespect contract
    const balance = await this._st.oldRespect.balanceOf("0x5fc8a2626F6Caf00c4Af06436c12C831a2f61c66");
    z.coerce.number().parse(balance);

    console.log("orContext validation successful");
  }

  private static _determineRunner(config: Config): ContractRunner {
    let runner: ContractRunner | undefined | null;
    if (config.contractRunner) {
      if (typeof config.contractRunner === 'string') {
        const url = zUrl.parse(config.contractRunner);
        runner = new JsonRpcProvider(url);
      } else {
        runner = config.contractRunner;
      }
    } else {
      if (!isEthAddr(config.orec)) {
        runner = config.orec.runner;
      } else if (!isEthAddr(config.newRespect)) {
        runner = config.newRespect.runner;
      }
    }
    if (!runner) {
      throw new InvalidArgumentError("Could not determine contract runner");
    }

    return runner;
  }

  static async create<CT_ extends Config>(config: CT_): Promise<ORContext<CT_>> {
    const runner = this._determineRunner(config);

    const network = await runner.provider?.getNetwork();
    console.debug("provider.getNetwork().chainId: ", network?.chainId);

    const orec: Orec = isEthAddr(config.orec)
      ? OrecFactory.connect(config.orec, runner)
      : config.orec;

    const newRespect = isEthAddr(config.newRespect)
      ? Respect1155Factory.connect(config.newRespect, runner)
      : config.newRespect; 

    const oldRespAddr = zEthNonZeroAddress.parse(await orec.respectContract());
    console.debug("oldRespectAddr: ", oldRespAddr);
    const oldRespect = FractalRespectFactory.connect(oldRespAddr, runner);

    const st = {
      orec, newRespect, oldRespect,
      ornode: config.ornode as CT_['ornode'],
    };

    const ctx = new ORContext<CT_>(st as any, runner, false);
    ctx._oldRespectAddr = oldRespAddr;

    await ctx.validate();

    // console.debug("This is new 4");

    return ctx;
  }

  callTest() {
    testVersion();
  }

  switchSigner(signer: Signer) {
    this._st.orec = this._st.orec.connect(signer);
  }

  connect(signer: Signer): ORContext<CT> {
    return new ORContext<CT>({ ...this._st, orec: this._st.orec.connect(signer) }, this._runner, false);
  }

  get orec(): Orec {
    return this._st.orec;
  }

  get newRespect(): Respect1155 {
    return this._st.newRespect;
  } 

  get ornode(): StateForConfig<CT>['ornode'] {
    return this._st.ornode;
  }

  get oldRespect(): FractalRespect {
    return this._st.oldRespect;
  }

  get fungibleId(): bigint {
    return 0n;
  }

  get runner(): ContractRunner {
    return this._runner;
  }

  get errorDecoder(): ErrorDecoder {
    return this._errDecoder;
  }

  async getOrecAddr(): Promise<EthAddress> {
    if (this._orecAddr === undefined) {
      this._orecAddr = await this._st.orec.getAddress();
    }
    return this._orecAddr;
  }

  async getOldRespectAddr(): Promise<EthAddress> {
    if (this._oldRespectAddr === undefined) {
      this._oldRespectAddr = await this._st.oldRespect.getAddress();
    }
    return this._oldRespectAddr;
  }

  async getNewRespectAddr(): Promise<EthAddress> {
    if (this._newRespectAddr === undefined) {
      this._newRespectAddr = await this._st.newRespect.getAddress();
    }
    return this._newRespectAddr;
  }

  async getProposalFromChain(id: PropId): Promise<OnchainProp> {
    const pstate = await this._st.orec.proposals(id)
    if (pstate.createTime === 0n) {
      throw new OnchainPropNotFound(id);
    }
    const propState = zProposalState.parse(pstate);
    const stage = zStage.parse(await this._st.orec.getStage(id));
    const voteStatus = zVoteStatus.parse(await this._st.orec.getVoteStatus(id));

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
