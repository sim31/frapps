import { Provider as EthProvider, JsonRpcProvider, Provider, Result, Signer } from "ethers";
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

export interface State {
  orec: Orec,
  newRespect: Respect1155,
  oldRespect: FractalRespect,
  ornode?: IORNode
}

export type StateWithOrnode = Required<State, 'ornode'>

export interface Config {
  orec: EthAddress | Orec,
  newRespect: EthAddress | Respect1155,
  ornode?: IORNode,
  ethProvider?: Provider | Url
}

export type ConfigWithOrnode = Required<Config, 'ornode'>;

export type StateForConfig<CT extends Config> =
  CT extends ConfigWithOrnode ? StateWithOrnode : State;

// TODO: async function to create context from addresses or passed contracts
// First base context with only respect contract and orec.
// Then extended class with old respect as well
// ORNode should accept this context through constructor
// See current ornodeMemImpl for how to create contracts from addresses

export class ORContext<CT extends Config> {
  private _st: StateForConfig<CT>;
  private _oldRespectAddr?: EthAddress;
  private _newRespectAddr?: EthAddress;
  private _orecAddr?: EthAddress;

  constructor(state: StateForConfig<CT>, validate: boolean = true) {
    this._st = state;
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

  private static _determineProvider(config: Config): Provider {
    let provider: Provider | undefined | null;
    if (config.ethProvider) {
      if (typeof config.ethProvider === 'string') {
        const url = zUrl.parse(config.ethProvider);
        provider = new JsonRpcProvider(url);
      } else {
        provider = config.ethProvider;
      }
    } else {
      if (!isEthAddr(config.orec)) {
        provider = config.orec.runner?.provider;
      } else if (!isEthAddr(config.newRespect)) {
        provider = config.newRespect.runner?.provider;
      }
    }
    if (!provider) {
      throw new InvalidArgumentError("Could not determine provider");
    }

    return provider;
  }

  static async create<CT extends Config>(config: CT): Promise<ORContext<CT>> {
    const provider = this._determineProvider(config);

    const network = await provider.getNetwork();
    console.debug("provider.getNetwork().chainId: ", network.chainId);

    const orec: Orec = isEthAddr(config.orec)
      ? OrecFactory.connect(config.orec, provider)
      : config.orec;

    const newRespect = isEthAddr(config.newRespect)
      ? Respect1155Factory.connect(config.newRespect, provider)
      : config.newRespect; 

    const oldRespAddr = zEthNonZeroAddress.parse(await orec.respectContract());
    console.debug("oldRespectAddr: ", oldRespAddr);
    const oldRespect = FractalRespectFactory.connect(oldRespAddr, provider);

    const st: State = {
      orec, newRespect, oldRespect,
      ornode: config.ornode
    };

    const ctx = new ORContext(st, false);
    ctx._oldRespectAddr = oldRespAddr;

    await ctx.validate();

    return ctx;
  }

  switchSigner(signer: Signer) {
    this._st.orec = this._st.orec.connect(signer);
  }

  connect(signer: Signer): ORContext<CT> {
    return new ORContext<CT>({ ...this._st, orec: this._st.orec.connect(signer) }, false);
  }

  get orec(): Orec {
    return this._st.orec;
  }

  get newRespect(): Respect1155 {
    return this._st.newRespect;
  } 

  get ornode(): ORContext<CT>['_st']['ornode'] {
    return this._st.ornode;
  }

  get oldRespect(): FractalRespect {
    return this._st.oldRespect;
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
    const propState = zProposalState.parse(await this._st.orec.proposals(id));
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