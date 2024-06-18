import { Orec, Orec__factory } from "orec/typechain-types";
import { z } from "zod";
import { zBytes32, zBytesLike, zEthAddress, zUint8 } from "./eth.js";
import { preprocessResultOrObj } from "./utils.js";

export type OrecContract = Orec;
export { Orec__factory };
export const OrecFactory = Orec__factory;
export type MessageStruct = Orec.MessageStruct;

export enum Stage {
  Voting,
  Veto,
  Execution,
  Expired
}
export const zStage = z.preprocess(
  val => zUint8.parse(val),
  z.nativeEnum(Stage)
);

export enum VoteStatus {
  Passing,
  Failing,
  Passed,
  Failed
}
export const zVoteStatus = z.preprocess(
  val => zUint8.parse(val),
  z.nativeEnum(VoteStatus)
);

export enum ExecStatus {
  NotExecuted = 0,
  Executed = 1,
  ExecutionFailed
}
const zExecStatusEnum = z.nativeEnum(ExecStatus);
export const zExecStatus = z.preprocess(val => zUint8.parse(val), zExecStatusEnum);

export const zPropId = zBytes32;
export type PropId = z.infer<typeof zPropId>;

export enum VoteType {
  None = 0,
  Yes = 1,
  No = 2
}
export const zVoteType = z.preprocess(
  val => zUint8.parse(val),
  z.nativeEnum(VoteType)
)

export enum KnownSignalTypes { 
  Tick = 0,
};
export const zKnownSignalTypes = z.preprocess(
  val => zUint8.parse(val),
  z.nativeEnum(KnownSignalTypes)
);

export const zSignalType = zUint8;
export const zCustomSignalType = zSignalType.gt(0);
export const zTickSignalType = z.literal(Number(zKnownSignalTypes.innerType().enum.Tick));

export type CCustomSignalArgs = Parameters<Orec['signal']>;
export type CMessage = Orec.MessageStruct;
export type CProposalState = Omit<
  Awaited<ReturnType<Orec["proposals"]>>,
  keyof [bigint, bigint, bigint, bigint]
>

export const zSignalArgsBase = z.object({
  signalType: zUint8, 
  data: zBytesLike
});
export const zSignalArgs = preprocessResultOrObj(zSignalArgsBase);
const customSignalVerify = zSignalArgs.refine((val) => {
  const args: CCustomSignalArgs = [
    val.signalType,
    val.data
  ];
  return true;
});
export type CustomSignalArgs = z.infer<typeof zSignalArgs>;

export const zPropStateBase = z.object({
  createTime: z.bigint().gt(0n),
  yesWeight: z.bigint(),
  noWeight: z.bigint(),
  status: zExecStatus
});
export const zProposalState = preprocessResultOrObj(zPropStateBase);
export type ProposalState = z.infer<typeof zProposalState>;

const zPropStateVerify = zProposalState.refine(val => {
  const cprop: CProposalState = {
    createTime: val.createTime,
    yesWeight: val.yesWeight,
    noWeight: val.noWeight,
    status: BigInt(val.status)
  };
  return true;
}, "Zod type does not match type from contract interface")


export const zProposedMsgBase = z.object({
  addr: zEthAddress,
  cdata: zBytesLike,
  memo: zBytesLike
});
export const zProposedMsg = preprocessResultOrObj(zProposedMsgBase);
const zProposedMsgVerify = zProposedMsg.refine(val => {
  const msg: CMessage = val;
  return true;
});
export type ProposedMsg = z.infer<typeof zProposedMsg>;

export const zOnchainProp = zPropStateBase.extend({
  id: zPropId,
  stage: zStage,
  voteStatus: zVoteStatus,
  createTime: z.date()
});
export type OnchainProp = z.infer<typeof zOnchainProp>;

export {
  MIN_1, HOUR_1, DAY_1, DAY_6, WEEK_1,
  propId
} from "orec/utils";

