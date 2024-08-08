import {
  RespectBreakout,
  zDecodedProposal,
  zRespectBreakout,
  zRespectAccount,
  Proposal,
  zProposal,
  RespectAccount,
  zBurnRespect,
  BurnRespect,
  CustomSignal,
  zProposalMetadata,
  ProposalMetadata,
  zCustomSignal,
  CustomCall,
  Tick,
  zTick,
  zVote,
  Vote,
  VoteType,
  zVoteType,
  Stage,
  zStage,
  ExecStatus,
  zExecStatus,
  VoteStatus,
  zVoteStatus,
  ExecError,
} from "../orclient.js";
import {
  zProposal as zNProposal,
  zRespectBreakout as zNRespectBreakout,
  zRespectAccount as zNRespectAccount,
  Proposal as NProposal,
  zProposalValid as zNProposalFull,
  zRespectBreakoutAttachment,
  zRespectAccountAttachment,
  zBurnRespectAttachment,
  zCustomSignalAttachment,
  zPropAttachmentBase,
  zCustomCallAttachment,
  zTickAttachment,
} from "../ornode.js";
import {
  zEthAddress,
  EthAddress,
  zBigNumberishToBigint,
  zBytesLikeToBytes,
  zBigIntToBytes32,
} from "../eth.js";
import { z } from "zod";
import { ConfigWithOrnode, ORContext as OrigORContext } from "../orContext.js";
import { addCustomIssue } from "../zErrorHandling.js";
import { Optional } from "utility-types";
import { MeetingNum, Factory as Respect1155Factory, zBurnRespectArgs, zMeetingNum, zMintRespectArgs, zTokenIdData } from "../respect1155.js";
import { Orec__factory as OrecFactory } from "orec/typechain-types";
import { zBreakoutMintRequest, zPropType } from "../fractal.js";
import { expect } from "chai";
import { unpackTokenId } from "respect1155-sc/utils/tokenId.js";
import {
  zCustomSignalType,
  zSignalArgs,
  zTickSignalType,
  Vote as NVote,
  VoteType as NVoteType,
  zVoteType as zNVoteType,
  zVote as zNVote,
  Stage as NStage,
  VoteStatus as NVoteStatus,
  ExecStatus as NExecStatus,
  OnchainProp
} from "../orec.js";

type ORContext = OrigORContext<ConfigWithOrnode>;

export const stageMap: Record<NStage, Stage> = {
  [NStage.Execution]: "Execution",
  [NStage.Expired]: "Expired",
  [NStage.Veto]: "Veto",
  [NStage.Voting]: "Voting"
};

export const voteStatusMap: Record<NVoteStatus, VoteStatus> = {
  [NVoteStatus.Failed]: "Failed",
  [NVoteStatus.Failing]: "Failing",
  [NVoteStatus.Passed]: "Passed",
  [NVoteStatus.Passing]: "Passing"
}

export const execStatusMap: Record<NExecStatus, ExecStatus> = {
  [NExecStatus.Executed]: "Executed",
  [NExecStatus.ExecutionFailed]: "ExecutionFailed",
  [NExecStatus.NotExecuted]: "NotExecuted"
}

export const zNAttachmentToMetadata = zPropAttachmentBase.transform((val, ctx) => {
  const r: ProposalMetadata = {
    propTitle: val.propTitle,
    propDescription: val.propDescription
  };
  return r;
}).pipe(zProposalMetadata);

const respectInterface = Respect1155Factory.createInterface();
const orecInterface = OrecFactory.createInterface();

export const zMintArgsToRespectBreakout = zBreakoutMintRequest.transform((val, ctx) => {
  try {
    expect(val.mintRequests.length).to.be.greaterThanOrEqual(3).and.to.be.lessThanOrEqual(6);

    const rankings: EthAddress[] = [];
    let meetingNum: MeetingNum | undefined;

    for (const [i, req] of val.mintRequests.entries()) {
      const tokenIdData = unpackTokenId(req.id);
      const periodNum = zBigNumberishToBigint.parse(tokenIdData.periodNumber); 
      if (meetingNum === undefined) {
        meetingNum = zMeetingNum.parse(periodNum + 1n);
      } else {
        expect(periodNum + 1n).to.be.equal(BigInt(meetingNum));
      }
      rankings.push(tokenIdData.owner);
    }
    
    if (meetingNum !== undefined) {
      const r: Optional<RespectBreakout, 'groupNum'> = {
        propType: zPropType.Enum.respectBreakout,
        meetingNum: meetingNum,
        rankings,
        mintData: zBytesLikeToBytes.parse(val.data),
        metadata: {}
      };
      return r;
    }
  } catch (err) {
    addCustomIssue(val, ctx, err, "Exception in zMintArgsToRespectBreakout");
  }
}).pipe(zRespectBreakout.partial({ groupNum: true }));

function mkzNProposalToRespectBreakout(orctx: ORContext) {
  return zNProposalFull.transform(async (val, ctx) => {
    try {
      const attachment = zRespectBreakoutAttachment.parse(val.attachment);

      expect(val.content.addr).to.be.equal(
        await orctx.getNewRespectAddr(),
        "respect breakout message expected to be addressed to newRespectAddr"
      );

      const data = zBytesLikeToBytes.parse(val.content.cdata);
      const tx = respectInterface.parseTransaction({ data });
      expect(tx?.name).to.be.equal(
        respectInterface.getFunction('mintRespectGroup').name,
        "expected mintRespectGroup function to be called"
      );
      const respectBreakout = zMintArgsToRespectBreakout.parse(tx?.args);
      respectBreakout.groupNum = attachment.groupNum;
      respectBreakout.metadata = zNAttachmentToMetadata.parse(attachment)

      return respectBreakout;
    } catch(err) {
      addCustomIssue(val, ctx, err, "Exception in zNProposalToRespectBreakout");
    }
  }).pipe(zRespectBreakout);
}

function mkzNProposalToRespectAccount(orctx: ORContext) {
  return zNProposalFull.transform(async (val, ctx) => {
    try {
      const attachment = zRespectAccountAttachment.parse(val.attachment);

      expect(val.content.addr).to.be.equal(
        await orctx.getNewRespectAddr(),
        "respect breakout message expected to be addressed to newRespectAddr"
      );

      const data = zBytesLikeToBytes.parse(val.content.cdata);
      const tx = respectInterface.parseTransaction({ data });
      expect(tx?.name).to.be.equal(
        respectInterface.getFunction('mintRespect').name,
        "expected mintRespect function to be called"
      );

      const args = zMintRespectArgs.parse(tx?.args);

      const tdata = zTokenIdData.parse(unpackTokenId(args.request.id));

      const r: RespectAccount = {
        propType: zPropType.Enum.respectAccount,
        meetingNum: tdata.periodNumber + 1,
        mintType: tdata.mintType,
        account: tdata.owner,
        value: args.request.value,
        title: attachment.mintTitle,
        reason: attachment.mintReason,
        metadata: zNAttachmentToMetadata.parse(attachment),
        tokenId: zBigIntToBytes32.parse(args.request.id)
      }

      return r;
    } catch(err) {
      addCustomIssue(val, ctx, err, "Exception in zNProposalToRespectAccount");
    }
  }).pipe(zRespectAccount);
}

function mkzNProposalToBurnRespect(orctx: ORContext) {
  return zNProposalFull.transform(async (val, ctx) => {
    try {
      const attachment = zBurnRespectAttachment.parse(val.attachment);

      expect(val.content.addr).to.be.equal(
        await orctx.getNewRespectAddr(),
        "respect account message expected to be addressed to newRespectAddr"
      );

      const data = zBytesLikeToBytes.parse(val.content.cdata);
      const tx = respectInterface.parseTransaction({ data });
      expect(tx?.name).to.be.equal(
        respectInterface.getFunction('burnRespect').name,
        "expected burnRespect function to be called"
      );

      const args = zBurnRespectArgs.parse(tx?.args);

      const tdata = zTokenIdData.parse(unpackTokenId(args.tokenId));

      const r: BurnRespect = {
        propType: zPropType.Enum.burnRespect,
        tokenId: zBigIntToBytes32.parse(args.tokenId),
        reason: attachment.burnReason,
        metadata: zNAttachmentToMetadata.parse(attachment)
      }

      return r;
    } catch(err) {
      addCustomIssue(val, ctx, err, "Exception in zProposalToBurnRespect");
    }
  }).pipe(zBurnRespect);

}

function mkzNProposalToCustomSignal(orctx: ORContext) {
  return zNProposalFull.transform(async (val, ctx) => {
    try {
      const attachment = zCustomSignalAttachment.parse(val.attachment);

      expect(val.content.addr).to.be.equal(
        await orctx.getOrecAddr(),
        "custom signal supposed to be addressed to orec"
      );

      const data = zBytesLikeToBytes.parse(val.content.cdata);
      const tx = orecInterface.parseTransaction({ data });
      expect(tx?.name).to.be.equal(
        orecInterface.getFunction('signal').name,
        "expected signal function to be called"
      );

      const args = zSignalArgs.parse(tx?.args);
      // Throws if it is a tick signal
      const signalType = zCustomSignalType.parse(args.signalType);

      const r: CustomSignal = {
        propType: zPropType.Enum.customSignal,
        data: zBytesLikeToBytes.parse(args.data),
        link: attachment.link,
        signalType,
        metadata: zNAttachmentToMetadata.parse(attachment)
      }

      return r;
    } catch(err) {
      addCustomIssue(val, ctx, err, "Exception in zNProposalToCustomSignal");
    }
  }).pipe(zCustomSignal);
}

function mkzNProposalToTick(orctx: ORContext) {
  return zNProposalFull.transform(async (val, ctx) => {
    try {
      const attachment = zTickAttachment.parse(val.attachment);

      expect(val.content.addr).to.be.equal(
        await orctx.getOrecAddr(),
        "custom signal supposed to be addressed to orec"
      );

      const data = zBytesLikeToBytes.parse(val.content.cdata);
      const tx = orecInterface.parseTransaction({ data });
      expect(tx?.name).to.be.equal(
        orecInterface.getFunction('signal').name,
        "expected signal function to be called"
      );

      const args = zSignalArgs.parse(tx?.args);
      // Throws if it is not a tick signal
      zTickSignalType.parse(args.signalType);

      const r: Tick = {
        propType: zPropType.Enum.tick,
        data: zBytesLikeToBytes.parse(args.data),
        link: attachment.link,
        metadata: zNAttachmentToMetadata.parse(attachment)
      };

      return r;
    } catch(err) {
      addCustomIssue(val, ctx, err, "Exception in zNProposalToTick")
    }
  }).pipe(zTick);
}

function mkzNProposalToCustomCall(orctx: ORContext) {
  return zNProposalFull.transform(async (val, ctx) => {
    try{
      const attachment = zCustomCallAttachment.parse(val.attachment);

      const r: CustomCall = {
        cdata: zBytesLikeToBytes.parse(val.content.cdata),
        address: val.content.addr,
        propType: zPropType.Enum.customCall,
        metadata: zNAttachmentToMetadata.parse(attachment)
      }

      return r;
    } catch(err) {
      addCustomIssue(val, ctx, err, "Exception in zNProposalToCustomCall")
    }
  }).pipe(zCustomSignal)
}

function mkzNProposalToDecodedProp(orctx: ORContext) {
  const zNProposalToRespectBreakout = mkzNProposalToRespectBreakout(orctx);
  const zNProposalToRespectAccount = mkzNProposalToRespectAccount(orctx);
  const zNProposalToBurnRespect = mkzNProposalToBurnRespect(orctx);
  const zNProposalToCustomSignal = mkzNProposalToCustomSignal(orctx);
  const zNProposalToCustomCall = mkzNProposalToCustomCall(orctx);
  const zNProposalToTick = mkzNProposalToTick(orctx);

  return zNProposalFull.transform(async (val, ctx) => {
    if (val.attachment !== undefined && val) {
      switch (val.attachment.propType) {
        case 'respectBreakout':
          return await zNProposalToRespectBreakout.parseAsync(val);
        case 'respectAccount':
          return await zNProposalToRespectAccount.parseAsync(val);
        case 'burnRespect':
          return await zNProposalToBurnRespect.parseAsync(val);
        case 'customSignal':
          return await zNProposalToCustomSignal.parseAsync(val);
        case 'customCall':
          return await zNProposalToCustomCall.parseAsync(val);
        case 'tick':
          return await zNProposalToTick.parseAsync(val);
        default: {
          const exhaustiveCheck: never = val.attachment;
          addCustomIssue(val, ctx, "Exhaustiveness check failed in zProposalToDecodedProp");
          return;
        }
      }
    }
  }).pipe(zDecodedProposal);
}

export const orecToClientVTMap: Record<NVoteType, VoteType> = {
  [NVoteType.Yes]: "Yes",
  [NVoteType.No]: "No",
  [NVoteType.None]: "None"
}

export const zNVoteTypeToClient = zNVoteType.transform((vt) => {
  return orecToClientVTMap[vt];
}).pipe(zVoteType);

export const zNVoteToClient = zNVote.transform(val => {
  const v: Vote = {
    voteType: zNVoteTypeToClient.parse(val.vtype),
    weight: Number(val.weight)
  }
  return v;
}).pipe(zVote)

export class NodeToClientTransformer {
  private _ctx: ORContext;
  private _zNProposalToDecodedProp: ReturnType<typeof mkzNProposalToDecodedProp>;

  constructor(context: ORContext) {
    this._ctx = context;

    this._zNProposalToDecodedProp = mkzNProposalToDecodedProp(context);
  }

  async getExecStatus(
    nodeProp: NProposal,
    onchainProp: OnchainProp
  ): Promise<{ status: ExecStatus, execError?: ExecError}> {
    const status = execStatusMap[onchainProp.status];
    const returnVal = { status };
    if (
      status === "ExecutionFailed" &&
      nodeProp.executeTxHash !== undefined &&
      this._ctx.runner.provider
    ) {
      const receipt = await this._ctx.runner.provider.getTransactionReceipt(nodeProp.executeTxHash);
      if (receipt === null) {
        console.error("Could not find transaction referenced as executeTxHash in proposal retrieved from ornode");
        return returnVal;
      }
      const filter = this._ctx.orec.filters.ExecutionFailed(nodeProp.id);
      const events = await this._ctx.orec.queryFilter(
        filter,
        receipt.blockNumber, receipt.blockNumber
      );
      if (events.length !== 1) {
        console.error("Expected one ExecutionFailed event for proposal ", nodeProp.id, ". All proposals: ", JSON.stringify(events));
        return returnVal;
      } else {
        try {
          const retVal = events[0].args.retVal;
          const error = this._ctx.errorDecoder.decodeReturnData(retVal);
          return { status, execError: error };
        } catch (err) {
          console.error("Error decoding return data: ", err);
          return returnVal;
        }
      }

    } else {
      return returnVal;
    }
  }

  async transformProp(nodeProp: NProposal): Promise<Proposal> {
    const propId = nodeProp.id;
    const onchainProp = await this._ctx.getProposalFromChain(propId);
    const { status, execError } = await this.getExecStatus(nodeProp, onchainProp)
    const rProp: Proposal = {
      ...onchainProp,
      status: status,
      execError,
      stage: stageMap[onchainProp.stage],
      voteStatus: voteStatusMap[onchainProp.voteStatus],
    };

    if (nodeProp.content !== undefined) {
      rProp.addr = nodeProp.content.addr;
      rProp.cdata = nodeProp.content.cdata;
      rProp.memo = nodeProp.content.memo;
      rProp.createTxHash = nodeProp.createTxHash;
      rProp.executeTxHash = nodeProp.executeTxHash;
      if (nodeProp.attachment !== undefined) {
        rProp.decoded = await this._zNProposalToDecodedProp.parseAsync(nodeProp);
      }
    }
    return rProp;
  }

  transformVote(vote: NVote): Vote {
    return zNVoteToClient.parse(vote);
  }
}
