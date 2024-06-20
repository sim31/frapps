import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers.js";
import {
  FractalRespect,
  FractalRespect__factory as FractalRespectFactory
} from "op-fractal-sc";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import {
  Respect1155,
  WEEK_1, DAY_6, DAY_1, HOUR_1,
  IORNode,
  propId,
  OrecContract as Orec,
  OrecFactory,
  EthAddress,
  zEthAddress
} from "ortypes";
import { z } from "zod";
import jsonfile from "jsonfile";

export interface DevConfig {
  oldRanksDelay: bigint;
  votePeriod: bigint;
  vetoPeriod: bigint;
  voteThreshold: number;
  redirectOutTo?: string;
}

export const defaultDevConfig: DevConfig = {
  oldRanksDelay: 518400n,
  votePeriod: DAY_1,
  vetoPeriod: DAY_6,
  voteThreshold: 21,
}

export const zSerializableState = z.object({
  oldRanksDelay: z.coerce.number(),
  addrs: z.array(zEthAddress),
  oldRespectAddr: zEthAddress,
  nonRespectedAccs: z.array(zEthAddress),
  orecAddr: zEthAddress,
  votePeriod: z.coerce.number(),
  vetoPeriod: z.coerce.number(),
  voteThreshold: z.coerce.number(),
  newRespectAddr: zEthAddress,
  providerUrl: z.string().url(),
});
export type SerializableState = z.infer<typeof zSerializableState>;

export interface DeployState extends SerializableState {
  signers: HardhatEthersSigner[];
  oldRespect: FractalRespect;
  oldRespectOwner: HardhatEthersSigner;
  oldRespectExecutor: HardhatEthersSigner;
  orec: Orec;
  newRespect: Respect1155.Contract;
}

export class Deployment {
  private _state: DeployState;

  private constructor(state: DeployState) {
    this._state = state;
  }

  get state(): DeployState {
    return { ...this._state };
  }

  get serializableState(): SerializableState {
    return {
      oldRanksDelay: this._state.oldRanksDelay,
      addrs: this._state.addrs,
      oldRespectAddr: this._state.oldRespectAddr,
      nonRespectedAccs: this._state.nonRespectedAccs,
      orecAddr: this._state.orecAddr,
      votePeriod: this._state.votePeriod,
      vetoPeriod: this._state.vetoPeriod,
      voteThreshold: this._state.voteThreshold,
      newRespectAddr: this._state.newRespectAddr,
      providerUrl: this._state.providerUrl
    }
  }

  /**
   * Connects to hardhat network and retrieves all relevant parameters,
   * creates relevant contracts
   * Has to be run from hardhat script environment (run using `hardhat run <script-name>`)
   */
  public static async devConnect(serializedStatePath: string): Promise<Deployment> {
    const st = Deployment.deserializeState(serializedStatePath);
    const signers = await hre.ethers.getSigners();
    const oldRespect: FractalRespect = FractalRespectFactory.connect(st.oldRespectAddr, hre.ethers.provider);
    const newRespect: Respect1155.Contract = Respect1155.Factory.connect(st.newRespectAddr, hre.ethers.provider);
    const orec: Orec = OrecFactory.connect(st.orecAddr, hre.ethers.provider);

    const oldRespOwnerAddr = await oldRespect.owner();
    const oldRespExecAddr = await oldRespect.executor();
    const oldRespectOwner = await hre.ethers.getSigner(oldRespOwnerAddr);
    const oldRespectExecutor = await hre.ethers.getSigner(oldRespExecAddr);

    const s: DeployState = {
      ...st,
      signers, oldRespect, newRespect, orec, oldRespectOwner, oldRespectExecutor
    };

    return new Deployment(s);
  }

  /**
   * Deploys and sets up contracts on hardhat local network.
   * Has to be run from hardhat script environment (run using `hardhat run <script-name>`)
   */
  public static async devDeploy(cfg: DevConfig = defaultDevConfig): Promise<Deployment> {
    ///// Get signers
    const signers = await hre.ethers.getSigners();
    const addrs = signers.map(signer => signer.address);

    ///// Deploy old respect contract
    const signer: HardhatEthersSigner = signers[0];
    const oldRespectFactory = new FractalRespectFactory(signer);

    let oldRespect = await oldRespectFactory.deploy(
      "TestFractal",
      "TF",
      signer,
      signer,
      cfg.oldRanksDelay
    );
    oldRespect = await oldRespect.waitForDeployment();
    const oldRespectAddr = await oldRespect.getAddress();

    console.log("deployed old respect: ", oldRespectAddr);

    //// Run old respect contract to distribute old Respect
    const groupRes1: FractalRespect.GroupRanksStruct[] = [
      {
        groupNum: 1,
        ranks: [
          addrs[16], addrs[15], addrs[14], addrs[13], addrs[12], addrs[11]
        ]
      }
    ]
    await oldRespect.submitRanks(groupRes1);

    console.log("Submitted ranks: ", groupRes1);

    await time.increase(WEEK_1);

    const groupRes2: FractalRespect.GroupRanksStruct[] = [
      {
        groupNum: 1,
        ranks: [
          addrs[14], addrs[11], addrs[16], addrs[12], addrs[13], addrs[15]
        ]
      }
    ]
    await oldRespect.submitRanks(groupRes2);

    console.log("Submitted ranks: ", groupRes2);

    await time.increase(WEEK_1);

    const groupRes3: FractalRespect.GroupRanksStruct[] = [
      {
        groupNum: 1,
        ranks: [
          addrs[7], addrs[11], addrs[16], addrs[12], addrs[13], addrs[14]
        ]
      },
      {
        groupNum: 2,
        ranks: [
          addrs[1], addrs[2], addrs[3], addrs[4], addrs[5], addrs[6]
        ]
      }
    ]
    await oldRespect.submitRanks(groupRes3);
    console.log("Submitted ranks: ", groupRes3);

    await time.increase(WEEK_1);

    const groupRes4: FractalRespect.GroupRanksStruct[] = [
      {
        groupNum: 1,
        ranks: [
          addrs[6], addrs[2], addrs[3], addrs[1], addrs[4], addrs[5]
        ]
      },
      {
        groupNum: 2,
        ranks: [
          addrs[12], addrs[10], addrs[8], addrs[13], addrs[14], addrs[15]
        ]
      }
    ]
    await oldRespect.submitRanks(groupRes4);
    console.log("Submitted ranks: ", groupRes4);

    const nonRespectedAccs = [ addrs[0], addrs[9], addrs[17], addrs[18] ];

    console.log("Test balanceOf: ", await oldRespect.balanceOf(addrs[12]));

    //////// Deploy Orec ///////////
    const orecFactory = new OrecFactory(signer);

    let orec = await orecFactory.deploy(
      oldRespectAddr,
      cfg.votePeriod, cfg.vetoPeriod, cfg.voteThreshold
    );
    orec = await orec.waitForDeployment();
    const orecAddr = await orec.getAddress();
    console.log("Deployed OREC: ", orecAddr);
    // Test
    console.log("test by calling voteLen()", await orec.voteLen());
    console.log("test by calling respectContract()", await orec.respectContract());

    ///////// Deploy new respect contract /////////
    const respectFactory = new Respect1155.Factory(signers[0]);

    let newRespect = await respectFactory.deploy(orec, "https://tf.io");
    newRespect = await newRespect.waitForDeployment();
    const newRespectAddr = await newRespect.getAddress();
    console.log("Deployed new Respect: ", newRespectAddr);
    console.log("Test by calling owner(): ", await newRespect.owner());

    const state: DeployState = {
      oldRanksDelay: z.coerce.number().parse(cfg.oldRanksDelay),
      addrs, signers, oldRespect, oldRespectAddr,
      oldRespectOwner: signer, oldRespectExecutor: signer,
      nonRespectedAccs,
      orec, orecAddr,
      votePeriod: z.coerce.number().parse(cfg.votePeriod),
      vetoPeriod: z.coerce.number().parse(cfg.vetoPeriod),
      voteThreshold: cfg.voteThreshold,
      newRespect, newRespectAddr,
      providerUrl: "http://localhost:8545"
    };

    return new Deployment(state);
  }

  /**
   * Synchronous
   */
  static serializeState(st: SerializableState, path: string) {
    jsonfile.writeFileSync(path, st, { spaces: 2 });
  } 

  static deserializeState(path: string): SerializableState {
    const obj = jsonfile.readFileSync(path);
    return zSerializableState.parse(obj);
  }

  serialize(path: string) {
    Deployment.serializeState(this.serializableState, path);
  }
}

