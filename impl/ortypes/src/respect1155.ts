import { Result, ZeroAddress } from "ethers";
import { isTokenIdValid } from "respect1155-sc/utils/tokenId.js";
import { Respect1155, Respect1155Interface } from "respect1155-sc/typechain-types/contracts/Respect1155.js";
import { Respect1155__factory } from "respect1155-sc/typechain-types/index.js";
import { zBigNumberish, zBytes32, zBytesLike, zEthAddress } from "./eth.js";
import { z } from "zod";
import { preprocessResultOrObj } from "./utils.js";

export type Contract = Respect1155;
export const Factory = Respect1155__factory;
export type Interface = Respect1155Interface;

export const zMeetingNum = z.coerce.number().gt(0);
export type MeetingNum = z.infer<typeof zMeetingNum>;

export const zPeriodNum = z.coerce.number().gte(0);
export type PeriodNum = z.infer<typeof zPeriodNum>;


export const zTokenId = zBytes32.refine(val => {
  return isTokenIdValid(val);
});
export type TokenId = z.infer<typeof zTokenId>;

export const zTokenIdNum = z.bigint().refine(val => {
  return isTokenIdValid(val);
})
export type TokenIdNum = z.infer<typeof zTokenIdNum>;

export const zMintType = z.coerce.number().gte(0);
export type MintType = z.infer<typeof zMintType>;

export const zBreakoutMintType = z.literal(0);
export type BreakoutMintType = z.infer<typeof zBreakoutMintType>;

export const zUnspecifiedMintType = z.literal(1);

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

export type CMintRespectGroupArgs = Parameters<Respect1155["mintRespectGroup"]>
export type CMintRespectArgs = Parameters<Respect1155["mintRespect"]>;
export type CBurnRespectArgs = Parameters<Respect1155['burnRespect']>;

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

export * from "respect1155-sc/utils/tokenId.js";