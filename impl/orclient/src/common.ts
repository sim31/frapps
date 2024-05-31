import { dataLength, getBigInt, hexlify, isAddress, isHexString } from "ethers";
import { Orec } from "orec/typechain-types/index.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { z } from "zod";
import { TokenId as TokenIdT, unpackTokenId } from "respect-sc/utils/tokenId.js";
import { ZeroAddress } from "ethers";

export enum Stage {
  Voting,
  Veto,
  Execution,
  Expired
}
export const zStage = z.nativeEnum(Stage);

export enum VoteStatus {
  Passing,
  Failing,
  Passed,
  Failed
}
export const zVoteStatus = z.nativeEnum(VoteStatus);

export enum ExecStatus {
  NotExecuted = 0,
  Executed = 1,
  ExecutionFailed
}
export const zExecStatus = z.nativeEnum(ExecStatus);

export const zBytes = z.string().refine((val) => {
  return isHexString(val);
});

export const zBytes32 = z.string().refine((val) => {
  return isHexString(val, 32);
})

export const zBytesLike = z.string().or(z.instanceof(Uint8Array));

export const zBytesLikeToBytes = zBytesLike.transform((val, ctx) => {
  return hexlify(val);
}).pipe(zBytes);

export const zPropId = zBytes32;
export type PropId = z.infer<typeof zPropId>;

export const zEthAddress = z.string().refine((val) => {
  return isAddress(val);
});
export type EthAddress = z.infer<typeof zEthAddress>;
export type Account = EthAddress

export function isEthAddr(val: any): val is EthAddress {
  try {
    zEthAddress.parse(val);
    return true;
  } catch (err) {
    return false;
  }
}

export enum VoteType {
  None = 0,
  Yes = 1,
  No = 2
}
export const zVoteType = z.nativeEnum(VoteType);

export const zTokenId = zBytes32.refine(val => {
  try {
    const unpacked = unpackTokenId(val);
    return unpacked.owner !== ZeroAddress;
  } catch {
    return false;
  }
});
export type TokenId = z.infer<typeof zTokenId>;

export const zBigNumberish = z.coerce.bigint();

export const zUint = z.bigint().gt(0n);

export const zUint8 = z.coerce.number().gte(0).lte(255);

export const zMintType = z.coerce.number().gte(0);
export type MintType = z.infer<typeof zMintType>;

export const zBreakoutMintType = z.literal(0);
export type BreakoutMintType = z.infer<typeof zBreakoutMintType>;

export const zUnspecifiedMintType = z.literal(1);

export const zMeetingNum = z.coerce.number().gt(0);
export type MeetingNum = z.infer<typeof zMeetingNum>;

export const zBigNumberishToBigint = zBigNumberish.transform((val, ctx) => {
  return getBigInt(val);
}).pipe(z.bigint());


export const zTokenIdData = z.object({
  periodNumber: zMeetingNum,
  owner: zEthAddress,
  mintType: zMintType
}).refine(val => {
  return val.owner !== ZeroAddress;
});
export type TokenIdData = z.infer<typeof zTokenIdData>;
// TokenId
// * mintType
// * address
// * meetingnum

export const PropTypeValues = [
  "respectBreakout", "respectAccount", "burnRespect", "tick",
  "customSignal", "customCall"
] as const;
export const zPropType = z.enum(PropTypeValues);
export type PropType = z.infer<typeof zPropType>;

export const zGroupNum = z.coerce.number().gt(0)
export type GroupNum = z.infer<typeof zGroupNum>;

export const zRankings = z.array(zEthAddress).min(3).max(6);

export const zRankNum = z.number().lte(6).gt(0);

export enum KnownSignalTypes { 
  Tick = 0,
};
export const zKnownSignalTypes = z.nativeEnum(KnownSignalTypes);

export const zSignalType = zUint8;
export const zCustomSignalType = zSignalType.gt(0);
export const zTickSignalType = z.literal(Number(zKnownSignalTypes.enum.Tick));


export type CMintRespectGroupArgs = Parameters<Respect1155["mintRespectGroup"]>
export type CMintRespectArgs = Parameters<Respect1155["mintRespect"]>;
export type CBurnRespectArgs = Parameters<Respect1155['burnRespect']>;
export type CCustomSignalArgs = Parameters<Orec['signal']>;
export type CMessage = Orec.MessageStruct;
export type CProposalState = Omit<
  Awaited<ReturnType<Orec["proposals"]>>,
  keyof [bigint, bigint, bigint, bigint]
>

export const zMintRequest = z.object({
  id: zBigNumberish.gt(0n),
  value: zBigNumberish.gt(0n)
});
export type MintRequest = z.infer<typeof zMintRequest>;

export const zMintRespectGroupArgs = z.object({
  mintRequests: z.array(zMintRequest),
  data: zBytesLike
})
// This is just a compile time check that zMintRespectGroupArgs above match latest contract
const mintRespectGroupVerify = zMintRespectGroupArgs.refine(
  (val) => {
    const args: CMintRespectGroupArgs = [
      val.mintRequests,
      val.data,
    ];
    return true;
  }, "Zod type does not match type from contract interface"
);
export type MintRespectGroupArgs = z.infer<typeof zMintRespectGroupArgs>;

export const zMintRespectArgs = z.object({
  request: zMintRequest,
  data: zBytesLike
});
const mintRespectVerify = zMintRespectArgs.refine((val) => {
  const args: CMintRespectArgs = [
    val.request,
    val.data
  ];
  return true;
});
export type MintRespectArgs = z.infer<typeof zMintRespectArgs>;

export const zBurnRespectArgs = z.object({
  tokenId: zTokenId,
  data: zBytesLike
});
const burnRespectVerify = zBurnRespectArgs.refine((val) => {
  const args: CBurnRespectArgs = [
    val.tokenId,
    val.data
  ];
  return true;
});
export type BurnRespectArgs = z.infer<typeof zBurnRespectArgs>;

export const zSignalArgs = z.object({
  signalType: zUint8, 
  data: zBytesLike
});
const customSignalVerify = zSignalArgs.refine((val) => {
  const args: CCustomSignalArgs = [
    val.signalType,
    val.data
  ];
  return true;
});
export type CustomSignalArgs = z.infer<typeof zSignalArgs>;

export const zProposalState = z.object({
  createTime: z.bigint().gt(0n),
  yesWeight: z.bigint(),
  noWeight: z.bigint(),
  status: z.nativeEnum(ExecStatus)
})
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

export const zProposedMsg = z.object({
  addr: zEthAddress,
  cdata: zBytesLike,
  memo: zBytesLike
});
const zProposedMsgVerify = zProposedMsg.refine(val => {
  const msg: CMessage = val;
  return true;
});
export type ProposedMsg = z.infer<typeof zProposedMsg>;

export const zOnchainProp = zProposalState.extend({
  id: zPropId,
  stage: zStage,
  voteStatus: zVoteStatus,
  createTime: z.date()
});
export type OnchainProp = z.infer<typeof zOnchainProp>;




