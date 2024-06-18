import shelljs from "shelljs";
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers.js";
import { EthAddress, OrecFactory } from "ortypes";
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
  OrecContract as Orec
} from "ortypes";
import { sleep } from "ts-utils";

export interface Config {
  oldRanksDelay: bigint;
  votePeriod: bigint;
  vetoPeriod: bigint;
  voteThreshold: number;
  redirectOutTo?: string;
}

export const defaultConfig: Config = {
  oldRanksDelay: 518400n,
  votePeriod: DAY_1,
  vetoPeriod: DAY_6,
  voteThreshold: 21,
}

export interface LTState {
  oldRanksDelay: bigint;
  addrs: EthAddress[];
  signers: HardhatEthersSigner[];
  oldRespect: FractalRespect;
  oldRespectAddr: EthAddress;
  oldRespectOwner: HardhatEthersSigner;
  oldRespectExecutor: HardhatEthersSigner;
  nonRespectedAccs: EthAddress[];
  orec: Orec;
  orecAddr: EthAddress;
  votePeriod: bigint;
  vetoPeriod: bigint;
  voteThreshold: number;
  newRespect: Respect1155.Contract;
  newRespectAddr: EthAddress;
}

type Process = ReturnType<typeof shelljs['exec']>;

export class LocalTestnet {
  private _state: LTState;
  private _hhNodeProcess: Process

  private constructor(state: LTState, hhNodeProcess: Process) {
    this._state = state;
    this._hhNodeProcess = hhNodeProcess;
  }

  get state(): LTState {
    return { ...this._state };
  }

  public static async create(cfg: Config = defaultConfig): Promise<LocalTestnet> {
    let hhNodeProcess: Process;
    if (cfg.redirectOutTo !== undefined) {
      hhNodeProcess = shelljs.exec(`npx hardhat node > ${cfg.redirectOutTo}`, { async: true });
    } else {
      hhNodeProcess = shelljs.exec("npx hardhat node", { async: true });
    }
    await sleep(3000);

    ///// Get signers
    const signers = await hre.ethers.getSigners();
    const addrs = signers.map(signer => signer.address);

    ///// Deploy old respect contract
    const signer: HardhatEthersSigner = signers[0];
    const oldRespectFactory = new FractalRespectFactory(signer);

    const oldRespect = await oldRespectFactory.deploy(
      "TestFractal",
      "TF",
      signer,
      signer,
      cfg.oldRanksDelay
    );
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

    //////// Deploy Orec ///////////
    const orecFactory = new OrecFactory(signer);

    const orec = await orecFactory.deploy(
      await oldRespect.getAddress(),
      cfg.votePeriod, cfg.vetoPeriod, cfg.voteThreshold
    );
    const orecAddr = await orec.getAddress();
    console.log("Deployed OREC: ", orecAddr);

    ///////// Deploy new respect contract /////////
    const respectFactory = new Respect1155.Factory(signers[0]);

    const newRespect = await respectFactory.deploy(orec, "https://tf.io");
    const newRespectAddr = await newRespect.getAddress();
    console.log("Deployed new Respect: ", newRespectAddr);

    const state: LTState = {
      oldRanksDelay: cfg.oldRanksDelay,
      addrs, signers, oldRespect, oldRespectAddr,
      oldRespectOwner: signer, oldRespectExecutor: signer,
      nonRespectedAccs,
      orec, orecAddr,
      votePeriod: cfg.votePeriod,
      vetoPeriod: cfg.vetoPeriod,
      voteThreshold: cfg.voteThreshold,
      newRespect, newRespectAddr
    };

    return new LocalTestnet(state, hhNodeProcess);
  }

  public async shutDown(): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
      this._hhNodeProcess.on('exit', (code, signal) => {
        resolve();
        console.log("node process exiting from signal: ", signal);
      });
      this._hhNodeProcess.kill('SIGTERM');
    })
    return await promise;
  }

}

