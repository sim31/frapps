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
  zOnchainProp,
  zUint8,
  zProposedMsg,
  zVoteType,
  zCustomSignalType,
  PropTypeValues,
  zProposedMsgBase,
} from "./common.js";
import { IORNode, zPropContent, Proposal as NProp } from "./ornodeTypes.js";
import { Orec } from "orec/typechain-types/contracts/Orec.js";
import Rf from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { BigNumberish, TransactionResponse, isBytesLike } from "ethers";
import { Result } from "ethers";
import { unpackTokenId } from "op-fractal-sc/utils/tokenId.js";
import { expect } from 'chai';
import { z } from "zod";
import { zNProposalToRespectBreakout } from "./transformers/nodeToClientTransformer.js";
import { ContractTransactionResponse, TransactionReceipt } from "../node_modules/ethers/lib.commonjs/index.js";
import { DecodedError } from "ethers-decode-error";

type Signer = HardhatEthersSigner;

export const zProposalMetadata = z.object({
  propTitle: z.string().optional(),
  propDescription: z.string().optional()
})
export type ProposalMetadata = z.infer<typeof zProposalMetadata>;

export const zDecodedPropBase = z.object({
  propType: zPropType,
  metadata: zProposalMetadata
})
export type DecodedPropBase = z.infer<typeof zDecodedPropBase>;

export const zVoteRequest = z.object({
  propId: zPropId,
  vote: zVoteType,
  memo: z.string().optional()
});
export type VoteRequest = z.infer<typeof zVoteRequest>;

export const zVoteWithProp = zVoteRequest
  .omit({ propId: true })
  .extend({ vote: zVoteType.default(VoteType.Yes) })
export type VoteWithProp = z.infer<typeof zVoteWithProp>;

export const zVoteWithPropRequest = zVoteWithProp.partial({ vote: true });
export type VoteWithPropRequest = z.infer<typeof zVoteWithPropRequest>;

export const zBreakoutResult = z.object({
  groupNum: zGroupNum,
  rankings: zRankings
});
export type BreakoutResult = z.infer<typeof zBreakoutResult>;

export const zRespectBreakoutRequest = zBreakoutResult.extend({
  meetingNum: zMeetingNum.optional(),
  metadata: zProposalMetadata.optional()
})
export type RespectBreakoutRequest = z.infer<typeof zRespectBreakoutRequest>;

export const zRespectBreakout = zDecodedPropBase.merge(zBreakoutResult).extend({
  propType: z.literal(zPropType.Enum.respectBreakout),
  meetingNum: zMeetingNum,
  mintData: zBytes
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

export const zRespectAccountRequest = zRespectAccount
  .omit({ propType: true })
  .partial({ mintType: true, meetingNum: true, metadata: true })
export type RespectAccountRequest = z.infer<typeof zRespectAccountRequest>;

export const zBurnRespect = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.burnRespect),
  tokenId: zTokenId,
  reason: z.string()
})
export type BurnRespect = z.infer<typeof zBurnRespect>;

export const zBurnRespectRequest = zBurnRespect
  .omit({ propType: true })
  .partial({ metadata: true })
export type BurnRespectRequest = z.infer<typeof zBurnRespectRequest>;

export const zCustomSignal = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.customSignal),
  signalType: zCustomSignalType,
  data: zBytes,
  link: z.string().optional()
});
export type CustomSignal = z.infer<typeof zCustomSignal>;

export const zCustomSignalRequest = zCustomSignal
  .omit({ propType: true })
  .partial({ metadata: true });
export type CustomSignalRequest = z.infer<typeof zCustomSignalRequest>;

export const zTick = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.tick),
  link: z.string().optional(),
  data: zBytes
})
export type Tick = z.infer<typeof zTick>;

export const zTickRequest = zTick
  .omit({ propType: true })
  .partial({ metadata: true, data: true });
export type TickRequest = z.infer<typeof zTickRequest>;

export const zCustomCall = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.customCall),
  cdata: zBytes,
  address: zEthAddress
});
export type CustomCall = z.infer<typeof zCustomCall>;

export const zCustomCallRequest = zCustomCall.omit({ propType: true });
export type CustomCallRequest = z.infer<typeof zCustomCallRequest>;

export const zDecodedProposal = z.union([
  zCustomCall,
  zTick,
  zCustomSignal,
  zBurnRespect,
  zRespectAccount,
  zRespectBreakout
]);
export type DecodedProposal = z.infer<typeof zDecodedProposal>;

export const zProposal = zOnchainProp.merge(zProposedMsgBase.partial()).extend({
  decoded: zDecodedProposal.optional(),
});
export type Proposal = z.infer<typeof zProposal>;

export const zProposalMsgFull = zProposal.required({
  addr: true,
  cdata: true,
  memo: true,
})
export type ProposalMsgFull = z.infer<typeof zProposalMsgFull>;

export function isPropMsgFull(prop: Proposal): prop is ProposalMsgFull {
  return prop.addr !== undefined && prop.cdata !== undefined && prop.memo !== undefined;
}

/**
 * Converts to ProposalMsgFull without parsing, if possible.
 * Use this instead of zProposalMsgFull.parse to avoid parsing twice
 */ 
export function toPropMsgFull(prop: Proposal | ProposalMsgFull): ProposalMsgFull {
  return isPropMsgFull(prop) ? prop : zProposalMsgFull.parse(prop);
}

export type PropOfPropType<T extends PropType> =
  T extends typeof zPropType.Enum.respectBreakout ? RespectBreakout
  : (T extends typeof zPropType.enum.respectAccount ? RespectAccount
    : (T extends typeof zPropType.Enum.burnRespect ? BurnRespect
      : (T extends typeof zPropType.Enum.customSignal ? CustomSignal
        : (T extends typeof zPropType.Enum.customCall ? CustomCall
          : (T extends typeof zPropType.Enum.tick ? Tick
            : never
          )
        )
      )
    )
  );

export class NotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.message = message + " has not yet been implemented.";
  }
}

export class TxFailed extends Error {
  public decodedError?: DecodedError
  public receipt?: TransactionReceipt;

  constructor(
    response: ContractTransactionResponse,
    receipt: TransactionReceipt | null,
    message?: string
  );
  constructor(cause: unknown, decodedErr?: DecodedError, message?: string);
  constructor(
    responseOrCause: ContractTransactionResponse | unknown,
    receiptOrDec: TransactionReceipt | null | DecodedError| undefined,
    message?: string
  ) {
    const msg = `Transaction failed. Message: ${message}. responseOrCause: ${JSON.stringify(responseOrCause)}. receiptOrDecodedError: ${JSON.stringify(receiptOrDec)}`;
    super(msg);
    this.name = 'TxFailed';
    if (typeof receiptOrDec === 'object' && receiptOrDec !== null) {
      if ('name' in receiptOrDec) {
        this.decodedError = receiptOrDec;
      } else {
        this.receipt = receiptOrDec;
      }
    }
  }
}

/**
 * Thrown if orclient failed to push proposal to ornode
 */
export class PutProposalFailure extends Error {
  constructor(nprop: NProp, cause: any, msg?: string) {
    const m = `Failed submitting proposal to ornode. Proposal: ${JSON.stringify(nprop)}. Cause: ${cause}. msg: ${msg}`;
    super(m);
    this.name = 'PutProposalFailure';
  }

}

export type ProposalState = Awaited<ReturnType<Orec["proposals"]>>
