import { Orec } from "orec/typechain-types/index.js";

export enum Stage {
  Voting,
  Veto,
  Execution,
  Expired
}

export function toStage(i: bigint): Stage {
  return Number(i);
}

export enum VoteStatus {
  Passing,
  Failing,
  Passed,
  Failed
}

export function toVoteStatus(i: bigint): VoteStatus {
  return Number(i);
}

export enum ExecStatus {
  NotExecuted = 0,
  Executed = 1,
  ExecutionFailed
}

export function toExecStatus(i: bigint): ExecStatus {
  return Number(i);
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

export type PropType = 
  "respectBreakout" | "respectAccount" | "burnRespect" | "tick" | "customSignal" | "customCall";
