import { ZodType, z } from "zod";
import { PropType, zGroupNum, zPropType, zRankings } from "./fractal.js";
import { zCustomSignalType, zOnchainProp as zNOnchainProp, zPropId, zProposedMsgBase } from "./orec.js";
import { zMeetingNum, zMintType, zTokenId } from "./respect1155.js";
import { zBytes, zEthAddress, zTxHash, zUint } from "./eth.js";
import { zTimestamp } from "./common.js";
import { ErrorType } from "ethers-decode-error";

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

export const zVoteType = z.enum(["None", "Yes", "No"])
export type VoteType = z.infer<typeof zVoteType>;

export const zValidVoteType = z.enum(["Yes", "No"]);
export type ValidVoteType = z.infer<typeof zValidVoteType>;

export const zStage = z.enum(["Voting", "Veto", "Execution", "Expired"]);
export type Stage = z.infer<typeof zStage>;

export const zVoteStatus = z.enum(["Passing", "Failing", "Passed", "Failed"]);
export type VoteStatus = z.infer<typeof zVoteStatus>;

export const zExecStatus = z.enum(["NotExecuted", "Executed", "ExecutionFailed"]);
export type ExecStatus = z.infer<typeof zExecStatus>;

export const zVoteWeight = z.number().int().gte(0);
export type VoteWeight = z.infer<typeof zVoteWeight>;

export const zVoteRequest = z.object({
  propId: zPropId,
  vote: zVoteType,
  memo: z.string().optional()
});
export type VoteRequest = z.infer<typeof zVoteRequest>;

export const zVote = z.object({
  proposalId: zPropId,
  voter: zEthAddress,
  vote: zVoteType,
  weight: zVoteWeight,
  memo: z.string().optional(),
  date: z.date().optional(),
  txHash: zTxHash.optional(),
})
export type Vote = z.infer<typeof zVote>;

export const zVoteWithProp = zVoteRequest
  .omit({ propId: true })
  .extend({ vote: zVoteType.default("Yes") })
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
});
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
  reason: z.string(),
  tokenId: zTokenId
});
export type RespectAccount = z.infer<typeof zRespectAccount>;

// const respectAccountRequestEx = {
//   meetingNum: 1,
//   mintType: 1,
//   account: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
//   value: 10n,
//   title

// }
export const zRespectAccountRequest = zRespectAccount
  .omit({ propType: true, tokenId: true })
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

export const zExecErrorType = z.nativeEnum(ErrorType);
export type ExecErrorType = z.infer<typeof zExecErrorType>;

export const zExecError = z.object({
  type: zExecErrorType,
  data: z.string().nullable(),
  name: z.string().nullable(),
  reason: z.string().nullable(),
  args: z.array(z.any()),
  signature: z.string().nullable(),  
  selector: z.string().nullable(),
})
export type ExecError = z.infer<typeof zExecError>;

export const zUnknownExecError = z.object({
  retVal: zBytes
});

export const zOnchainProp = zNOnchainProp.extend({
  voteStatus: zVoteStatus,
  stage: zStage, 
  execError: zExecError.optional(),
});

export const zProposal = zOnchainProp.merge(zProposedMsgBase.partial()).extend({
  status: zExecStatus,
  decoded: zDecodedProposal.optional(),
  createTxHash: zTxHash.optional().describe("Hash of transaction which created this proposal"),
  executeTxHash: zTxHash.optional().describe("Hash of transaction which executed this proposal")
}).partial({
  noWeight: true,
  yesWeight: true,
});
export type Proposal = z.infer<typeof zProposal>;

export const zProposalMsgFull = zProposal.required({
  addr: true,
  cdata: true,
  memo: true,
})
export type ProposalMsgFull = z.infer<typeof zProposalMsgFull>;

export const zGetVotesSpec = z.object({
  before: z.date().optional(),
  limit: z.number().int().gt(0).optional(),
  propFilter: z.array(zPropId).optional(),
  voterFilter: z.array(zEthAddress).optional(),
  minWeight: zVoteWeight.optional(),
  voteType: zValidVoteType.optional()
}).strict();
export type GetVotesSpec = z.infer<typeof zGetVotesSpec>;

export const zGetProposalsSpec = z.object({
  before: z.date().optional(),
  limit: z.number().int().gt(0).optional(),
  execStatFilter: z.array(zExecStatus).optional(),
  voteStatFilter: z.array(zVoteStatus).optional(),
  stageFilter: z.array(zStage).optional()
}).strict();
/**
 * Some description
 */
export type GetProposalsSpec = z.infer<typeof zGetProposalsSpec>;

export const zGetAwardsSpec = z.object({
  before: z.date().optional(),
  limit: z.number().int().gt(0).optional(),
  recipient: zEthAddress.optional(),
  burned: z.boolean().optional()
}).strict();
export type GetAwardsSpec = z.infer<typeof zGetAwardsSpec>;

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


