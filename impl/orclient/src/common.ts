import { dataLength, getAddress, getBigInt, hexlify, isAddress, isBytesLike, isHexString } from "ethers";
import { Orec } from "orec/typechain-types/index.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { preprocess, z } from "zod";
import tokenIdPkg from  "respect-sc/utils/tokenId.js"
const { unpackTokenId, isTokenIdValid } = tokenIdPkg;
import { ZeroAddress } from "ethers";
import { Result } from "ethers";
import { addCustomIssue } from "./zErrorHandling.js";
import { expect } from "chai";

// TODO: Move s

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

export const zBytes = z.string().refine((val) => {
  return isHexString(val);
});
export type Bytes = z.infer<typeof zBytes>;

export const zBytes32 = z.string().refine((val) => {
  return isHexString(val, 32);
})

export const zBytesLike = z.string().or(z.instanceof(Uint8Array))
  .superRefine((val, ctx) => {
    if (isBytesLike(val)) {
      return true;
    } else {
      addCustomIssue(val, ctx, "Invalid bytes like value");
    }
  });

export const zBytesLikeToBytes = zBytesLike.transform((val, ctx) => {
  return hexlify(val);
}).pipe(zBytes);

export const zPropId = zBytes32;
export type PropId = z.infer<typeof zPropId>;

export const zEthAddress = z.string().transform((val) => {
  return getAddress(val);
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
export const zVoteType = z.preprocess(
  val => zUint8.parse(val),
  z.nativeEnum(VoteType)
)

export const zTokenId = zBytes32.refine(val => {
  return isTokenIdValid(val);
});
export type TokenId = z.infer<typeof zTokenId>;

export const zNonZeroBigInt = z.bigint().nonnegative().or(z.bigint().nonpositive());

export const zNonZeroNumber = z.number().nonnegative().or(z.number().nonpositive());

export const zTokenIdNum = z.bigint().refine(val => {
  return isTokenIdValid(val);
})
export type TokenIdNum = z.infer<typeof zTokenIdNum>;

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

export const zPeriodNum = z.coerce.number().gte(0);
export type PeriodNum = z.infer<typeof zPeriodNum>;

export const zBigNumberishToBigint = zBigNumberish.transform((val, ctx) => {
  return getBigInt(val);
}).pipe(z.bigint());


export const zTokenIdData = z.object({
  periodNumber: zPeriodNum,
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
export type Rankings = z.infer<typeof zRankings>;

export const zRankNum = z.number().lte(6).gt(0);

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

export type CMintRespectGroupArgs = Parameters<Respect1155["mintRespectGroup"]>
export type CMintRespectArgs = Parameters<Respect1155["mintRespect"]>;
export type CBurnRespectArgs = Parameters<Respect1155['burnRespect']>;
export type CCustomSignalArgs = Parameters<Orec['signal']>;
export type CMessage = Orec.MessageStruct;
export type CProposalState = Omit<
  Awaited<ReturnType<Orec["proposals"]>>,
  keyof [bigint, bigint, bigint, bigint]
>

function resultArrayToObj<T extends z.AnyZodObject>(val: unknown, baseZObj: T) {
  if (Array.isArray(val)) {
    const keys = Object.keys(baseZObj.keyof().Values);
    const res = Result.fromItems(val, keys);
    return res.toObject();
  } else {
    return val;
  }
}

function preprocessResultOrObj<T extends z.AnyZodObject>(baseZObj: T) {
  return z.preprocess(val => resultArrayToObj(val, baseZObj), baseZObj)
}


export const zMintRequestBase = z.object({
  id: zTokenIdNum,
  value: zBigNumberish.gt(0n)
});
export const zMintRequest = preprocessResultOrObj(zMintRequestBase);
export type MintRequest = z.infer<typeof zMintRequest>;

export const zMintRespectGroupArgsBase = z.object({
  mintRequests: z.array(zMintRequest),
  data: zBytesLike
})
export const zMintRespectGroupArgs = preprocessResultOrObj(zMintRespectGroupArgsBase);
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

export const zMintRespectArgsBase = z.object({
  request: zMintRequest,
  data: zBytesLike
});
export const zMintRespectArgs = preprocessResultOrObj(zMintRespectArgsBase);
const mintRespectVerify = zMintRespectArgs.refine((val) => {
  const args: CMintRespectArgs = [
    val.request,
    val.data
  ];
  return true;
});
export type MintRespectArgs = z.infer<typeof zMintRespectArgs>;

export const zBurnRespectArgsBase = z.object({
  tokenId: zTokenId,
  data: zBytesLike
});
export const zBurnRespectArgs = preprocessResultOrObj(zBurnRespectArgsBase);
const burnRespectVerify = zBurnRespectArgs.refine((val) => {
  const args: CBurnRespectArgs = [
    val.tokenId,
    val.data
  ];
  return true;
});
export type BurnRespectArgs = z.infer<typeof zBurnRespectArgs>;

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

export const zValueToRanking = z.bigint().transform((val, ctx) => {
  switch (val) {
    case 55n: {
      return 6;
    }
    case 34n: {
      return 5;
    }
    case 21n: {
      return 4;
    }
    case 13n: {
      return 3;
    }
    case 8n: {
      return 2;
    }
    case 5n: {
      return 1;
    }
    default: {
      addCustomIssue(val, ctx, "value is not equal to any of possible breakout group rewards");
      return NaN;
    }
  }
});

export const zBreakoutMintRequest = zMintRespectGroupArgs.superRefine((val, ctx) => {
  try {
    for (const [i, req] of val.mintRequests.entries()) {
      const rankFromVal = zValueToRanking.parse(req.value);
      expect(rankFromVal).to.be.equal(6 - i);
    }
  } catch (err) {
    addCustomIssue(val, ctx, err, "Error parsing zBreakoutMintRequest");
  }
});


