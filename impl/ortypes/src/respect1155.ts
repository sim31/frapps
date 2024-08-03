import { Result, ZeroAddress, zeroPadBytes } from "ethers";
import { isTokenIdValid } from "respect1155-sc/utils/tokenId.js";
import { Respect1155, Respect1155Interface } from "respect1155-sc/typechain-types/contracts/Respect1155.js";
import { Respect1155__factory } from "respect1155-sc/typechain-types/index.js";
import { zBigNumberish, zBytes32, zBytesLike, zEthAddress, zTxHash } from "./eth.js";
import { z } from "zod";
import { preprocessResultOrObj } from "./utils.js";
import { zErc1155Mt } from "./erc1155.js";

export {
  TransferBatchEvent,
  TransferSingleEvent
} from "respect1155-sc/typechain-types/@openzeppelin/contracts/token/ERC1155/IERC1155.js";
export * from "respect1155-sc/typechain-types/common.js";

export type Contract = Respect1155;
export const Factory = Respect1155__factory;
export type Interface = Respect1155Interface;

export const zGroupNum = z.coerce.number().int().gt(0)
export type GroupNum = z.infer<typeof zGroupNum>;

export const zRankNum = z.number().int().lte(6).gt(0);

export const zMeetingNum = z.coerce.number().int().gt(0);
export type MeetingNum = z.infer<typeof zMeetingNum>;

export const zPeriodNum = z.coerce.number().int().gte(0);
export type PeriodNum = z.infer<typeof zPeriodNum>;

export const zTokenId = zBytes32.refine(val => {
  return isTokenIdValid(val);
});
export type TokenId = z.infer<typeof zTokenId>;

export const zFungibleTokenId = z.literal(zeroPadBytes("0x00", 32));

export const zTokenIdNum = z.bigint().refine(val => {
  return isTokenIdValid(val);
})
export type TokenIdNum = z.infer<typeof zTokenIdNum>;

export const zMintType = z.coerce.number().int().gte(0);
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
  tokenId: zTokenIdNum,
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

/**
 * Metadata for fungible respect
 */
export const zRespectFungibleMt = zErc1155Mt.extend({
  decimals: z.literal(0)
});
/**
 * Metadata for fungible respect
 */
export type RespectFungibleMt = z.infer<typeof zRespectFungibleMt>;

export const zBurnData = z.object({
  burnTxHash: zTxHash.optional(),
  burnReason: z.string().optional(),
});
export type BurnData = z.infer<typeof zBurnData>;

export const zRespectAwardMt = zErc1155Mt
  .omit({ decimals: true })
  .required({ name: true })
  .extend({
    properties: z.object({
      tokenId: zTokenId,
      recipient: zEthAddress,
      mintType: zMintType,
      mintDateTime: z.string().datetime().optional(),
      mintTxHash: zTxHash.optional(),
      denomination: z.number().int().gte(0),
      periodNumber: zPeriodNum,
      groupNum: zGroupNum.optional(),
      level: zRankNum.optional(),
      reason: z.string().optional(),
      title: z.string().optional(),
      burn: zBurnData.nullable().optional(),
      mintProposalId: zBytes32.optional()
    })
});
export type RespectAwardMt = z.infer<typeof zRespectAwardMt>;

export const zGetTokenOpts = z.object({
  burned: z.boolean().default(false)
})
export type GetTokenOpts = z.infer<typeof zGetTokenOpts>;

export * from "respect1155-sc/utils/tokenId.js";