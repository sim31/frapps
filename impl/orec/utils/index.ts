import { ethers } from "ethers";
import { Orec } from "../typechain-types/index.js";
import { BytesLike, isBytesLike } from "ethers";

export const MIN_1 = 60n;
export const HOUR_1 = 60n * MIN_1;
export const DAY_1 = 24n * HOUR_1;
export const DAY_6 = 6n * DAY_1;
export const WEEK_1 = 7n * DAY_1;

export enum VoteType {
  None = 0,
  Yes = 1,
  No = 2
}

export enum ExecStatus {
  NotExecuted = 0,
  Executed,
  ExecutionFailed
}


export type PropId = BytesLike;
export function isPropId(value: any): value is PropId {
  return isBytesLike(value);
}

export function propId(msg: Orec.MessageStruct) {
  return ethers.solidityPackedKeccak256(
    [ "address", "bytes", "bytes" ],
    [msg.addr, msg.cdata, msg.memo]
  );
}
