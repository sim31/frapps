import { Optional } from "utility-types";
// TODO: Probably won't work for browser builds
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers.js";

type Signer = HardhatEthersSigner;

export enum Stage {
  Voting,
  Veto,
  Execution,
  Expired
}

export enum VoteStatus {
  Passing,
  Failing,
  Passed,
  Failed
}

export enum ExecStatus {
  NotExecuted = 0,
  Executed = 1,
  ExecutionFailed
}

export type PropId = string;
export type EthAddress = string
export type Account = EthAddress

export enum VoteType {
  None = 0,
  Yes = 1,
  No = 2
}

export type TokenId = string;
// TokenId
// * mintType
// * address
// * meetingnum

export interface RespectBreakout {
  propType: "respectBreakout",
  meetingNum: number,
  groupNum: number,
  rankings: Account[6],
}

export interface RespectAccount {
  propType: "respectAccount",
  meetingNum: number,
  mintType: number,
  account: Account,
  value: number,
  title: string
  reason: string,
}

export type RespectAccountRequest = Optional<Omit<RespectAccount, 'propType'>, 'meetingNum' | 'mintType'>;

export interface BurnRespect {
  propType: "burnRespect"
  tokenId: TokenId,
  reason: string
}

export interface CustomSignal {
  propType: "customSignal"
  data: string
}

export interface Tick {
  propType: "tick",
  data?: string
}

export type DecodedProposal =
  Tick | CustomSignal | BurnRespect | RespectAccount | RespectBreakout

export interface Proposal {
  id: PropId;
  address: string;
  cdata: string;
  memo: string,
  yesWeight: bigint;
  noWeight: bigint;
  createTime: Date;
  execStatus: ExecStatus;
  stage: Stage;
  voteStatus: VoteStatus;
  decoded?: DecodedProposal
}

export interface Config {
  eth: string;
  ornode: string | ORNode;
  signer: Signer;
}

export interface ORNode {
  
}

export interface BreakoutResult {
  groupNum: number;
  rankings: [
    Account, Account, Account, Account, Account, Account
  ]
}

export class NotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.message = message + " has not yet been implemented.";
  }
}

export class VoteEnded extends Error {
  constructor(stage?: Stage, message?: string) {
    super(message);
    this.message = `Vote has ended. Currenct stage: ${stage}. Message: ${message}`;
  }
}

export class ProposalFailed extends Error {
  constructor(message?: string) {
    super(message);
    this.message = `Proposal has failed. Message: ${message}`;
  }
}

export default class ORClient {
  private _config?: Config;

  static async createORClient(config: Config): Promise<ORClient> {
    const client = new ORClient();
    client._config = config;
    return client;
  }

  connect(signer: Signer): ORClient {
    const newCl = Object.create(this);
    if (newCl._config !== undefined) {
      newCl._config.signer = signer;
      return newCl;
    } else {
      throw new Error("Trying to connect un-initialized ORClient")
    }
  }

  /**
   * Returns proposal by id
   * @param id - proposal id
   */
  async getProposal(id: PropId): Promise<Proposal> {
    throw new NotImplemented("getProposal");
  }

  // UC8
  /**
   * Returns a list of proposals ordered from latest to oldest
   * @param from - Start of proposal range. 0 - last proposal, 1 - second to  last proposal and so on
   * @param count - Number of proposals to return
   */
  async lsProposals(from: number = 0, limit: number = 50): Promise<Proposal[]> {
    return []
  }

  // UC2
  async vote(propId: PropId, vote: VoteType, memo?: string) {}
  // UC3
  async execute(propId: PropId) {}

  // UC{1,4}
  async submitBreakoutResult(result: BreakoutResult): Promise<Proposal> {
    throw new NotImplemented("submitBreakoutResult");
  }
  // UC5
  async proposeRespectTo(req: RespectAccountRequest): Promise<Proposal> {
    throw new NotImplemented("proposeRespectTo");
  }
  // UC6
  async burnRespect(
    tokenId: TokenId,
    reason: string
  ): Promise<Proposal> {
    throw new NotImplemented("burnRespect");
  }
  // UC7
  async proposeTick(data?: string): Promise<Proposal> {
    throw new NotImplemented("proposeTick");
  }
  async proposeCustomSignal(data: string): Promise<Proposal> {
    throw new NotImplemented("proposeCustomSignal");
  }

  async getPeriodNum(): Promise<number> {
    return 0;
  }
  async getNextMeetingNum(): Promise<number> {
    return 0;
  }
  async getLastMeetingNum(): Promise<number> {
    return 0;
  }

  // TODO: function to list respect NTTs
}