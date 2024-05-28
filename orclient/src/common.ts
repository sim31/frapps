import { dataLength, isAddress, isHexString } from "ethers";
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

export const zPropId = zBytes32;
export type PropId = z.infer<typeof zPropId>;

export const zEthAddress = z.string().refine((val) => {
  return isAddress(val);
});
export type EthAddress = z.infer<typeof zEthAddress>;
export type Account = EthAddress

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

export const zUint = z.number().gt(0);

export const zTokenIdData = z.object({
  periodNumber: zBigNumberish,
  owner: zEthAddress,
  mintType: zBigNumberish
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

export const zMeetingNum = z.coerce.number().gt(0);
export type MeetingNum = z.infer<typeof zMeetingNum>;

export const zGroupNum = z.coerce.number().gt(0)
export type GroupNum = z.infer<typeof zGroupNum>;

export const zMintType = z.coerce.number().gt(0);
export type MintType = z.infer<typeof zMintType>;

export const zRankings = z.array(zEthAddress).min(3).max(6);

export type CMintRespectGroupArgs = Parameters<Respect1155["mintRespectGroup"]>
export type CMintRespectArgs = Parameters<Respect1155["mintRespect"]>;
export type CProposalState = Omit<
  Awaited<ReturnType<Orec["proposals"]>>,
  keyof [bigint, bigint, bigint, bigint]
>

export const zMintRequest = z.object({
  id: zBigNumberish.gt(0n),
  value: zBigNumberish.gt(0n)
});

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


