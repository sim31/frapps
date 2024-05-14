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
  account: Account,
  value: number,
  title: string
  reason: string,
}

export interface BurnRespect {
  propType: "burnRespect"
  tokenId: TokenId,
  reason: string
}

export interface CustomSignal {
  propType: "burnRespect"
  data: string
}

export interface Tick {
  propType: "tick",
  data: string
}

export type DecodedProposal =
  Tick | CustomSignal | BurnRespect | RespectAccount | RespectBreakout

export interface Proposal {
  id: PropId;
  address: string;
  cdata: string;
  yesWeight: number;
  noWeight: number;
  createTime: Date;
  execStatus: ExecStatus;
  stage: Stage;
  voteStatus: VoteStatus;
  decoded?: DecodedProposal
}


export default class ORClient {

  /**
   * Returns proposal by id
   * @param id - proposal id
   */
  getProposal(id: PropId) {
    return {}
  }

  /**
   * Returns a list of proposals ordered from latest to oldest
   * @param from - Start of proposal range. 0 - last proposal, 1 - second to  last proposal and so on
   * @param count - Number of proposals to return
   */
  lsProposals(from: number = 0, limit: number = 50): Proposal {
    return {}
  }

  vote(propId: PropId, vote: VoteType, memo?: string) {}
  execute(propId: PropId) {}

  submitBreakoutResult(
    group: number,
    rankings: Account[6]
  ) {}
  proposeRespectTo(
    account: Account,
    value: number,
    title: string,
    reason: string
  ) {}
  burnRespect(
    tokenId: TokenId,
    reason: string
  ) {}
  proposeTick(data: string) {}
  proposeCustomSignal(data: string) {

  }

  getPeriodNum(): number {
    return 0;
  }
  getNextMeetingNum(): number {
    return 0;
  }
  getLastMeetingNum(): number {
    return 0;
  }

  // TODO: function to list respect NTTs
}