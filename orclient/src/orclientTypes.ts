import { Optional } from "utility-types";
// TODO: Probably won't work for browser builds
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers.js";
import {
  Account,
  EthAddress,
  Stage,
  VoteStatus,
  VoteType,
  ExecStatus,
  TokenId,
  PropId,
  PropType,
  zExecStatus,
  zStage,
  zVoteStatus,
  zProposalState,
  zMintRespectGroupArgs,
  zPropType,
  zEthAddress,
  zMeetingNum,
  zGroupNum,
  zRankings,
  zMintType,
  zUint,
  zTokenId,
  zBytes,
  zPropId,
} from "./common.js";
import { IORNode, zPropContent } from "./ornodeTypes.js";
import { Orec } from "orec/typechain-types/contracts/Orec.js";
import Rf from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { BigNumberish, isBytesLike } from "ethers";
import { Result } from "ethers";
import { unpackTokenId } from "op-fractal-sc/utils/tokenId.js";
import { expect } from 'chai';
import { z } from "zod";
import { zProposalToRespectBreakout } from "./nodeToClientTransformer.js";

type Signer = HardhatEthersSigner;

export const zProposalMetadata = z.object({
  propTitle: z.string().optional(),
  propDescription: z.string().optional()
})
export type ProposalMetadata = z.infer<typeof zProposalMetadata>;

export const zDecodedPropBase = z.object({
  propType: zPropType
})
export type DecodedPropBase = z.infer<typeof zDecodedPropBase>;

export const zBreakoutResult = z.object({
  groupNum: zGroupNum,
  rankings: zRankings
});
export type BreakoutResult = z.infer<typeof zBreakoutResult>;

export const zRespectBreakout = zDecodedPropBase.merge(zBreakoutResult).extend({
  propType: z.literal(zPropType.Enum.respectBreakout),
  meetingNum: zMeetingNum,
});
export type RespectBreakout = z.infer<typeof zRespectBreakout>;

export const zRespectAccount = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.respectAccount),
  meetingNum: zMeetingNum,
  mintType: zMintType,
  account: zEthAddress,
  value: zUint,
  title: z.string(),
  reason: z.string()
});
export type RespectAccount = z.infer<typeof zRespectAccount>;

export const zRespectAccountRequest = zRespectAccount.omit({ propType: true }).extend({
  mintType: zMintType.optional(),
  meetingNum: zMeetingNum.optional()
});
export type RespectAccountRequest = z.infer<typeof zRespectAccountRequest>;

export const zBurnRespect = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.burnRespect),
  tokenId: zTokenId,
  reason: z.string()
})
export type BurnRespect = z.infer<typeof zBurnRespect>;

export const zCustomSignal = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.customSignal),
  data: zBytes
});
export type CustomSignal = z.infer<typeof zCustomSignal>;

export const zTick = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.tick),
  data: zBytes
})
export type Tick = z.infer<typeof zTick>;

export const zCustomCall = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.customCall)
});
export type CustomCall = z.infer<typeof zCustomCall>;

export const zDecodedProposal = z.union([
  zCustomCall,
  zTick,
  zCustomSignal,
  zBurnRespect,
  zRespectAccount,
  zRespectBreakout
]);
export type DecodedProposal = z.infer<typeof zDecodedProposal>;

export const zProposal = zProposalState.extend({
  id: zPropId,
  address: zEthAddress.optional(),
  cdata: zBytes.optional(),
  stage: zStage,
  voteStatus: zVoteStatus,
  decoded: zDecodedProposal.optional(),
  createTime: z.date()
})
export type Proposal = z.infer<typeof zProposal>;

export class NotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.message = message + " has not yet been implemented.";
  }
}

export class VoteEnded extends Error {
  constructor(stage?: Stage, message?: string) {
    super(message);
    this.message = `Vote has ended. Currenct stage: ${stage}. Message: ${message}`;
  }
}

export class ProposalFailed extends Error {
  constructor(message?: string) {
    super(message);
    this.message = `Proposal has failed. Message: ${message}`;
  }
}

export interface Config {
  // eth: string;
  ornode: IORNode;
  signer: Signer;
  orec: Orec;
  newRespect: Respect1155;
}

export type ProposalState = Awaited<ReturnType<Orec["proposals"]>>
