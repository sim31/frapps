import { EthAddress } from "ortypes";
import { GetTokenOpts, TokenId, BurnData, zRespectAwardMt as zNRespectAwardMt } from "ortypes/respect1155.js"
import { z } from "zod";

export * from "ortypes/respect1155.js";

export const zRespectAwardMt = zNRespectAwardMt;
export type RespectAwardMt = z.infer<typeof zRespectAwardMt>;

export interface IAwardStore {
  getAward: (id: TokenId, opts?: GetTokenOpts) => Promise<RespectAwardMt | null>

  getAwardsOf: (recipient: EthAddress, opts?: GetTokenOpts) => Promise<RespectAwardMt[]>

  createAwards: (awards: RespectAwardMt[]) => Promise<void>

  deleteAwards: (tokenIds: TokenId[]) => Promise<void>

  burnAwards: (tokenIds: TokenId[], burnData: BurnData) => Promise<void>

  updateAwardPropsIfExists: (
    tokenId: TokenId,
    update: Partial<RespectAwardMt['properties']>
  ) => Promise<boolean>
}