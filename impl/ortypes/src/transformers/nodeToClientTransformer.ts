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
  zTick
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
} from "../eth.js";
import { z } from "zod";
import { ORContext } from "../orContext.js";
import { addCustomIssue } from "../zErrorHandling.js";
import { Optional } from "utility-types";
import { MeetingNum, Factory as Respect1155Factory, zBurnRespectArgs, zMeetingNum, zMintRespectArgs, zTokenIdData } from "../respect1155.js";
import { Orec__factory as OrecFactory } from "orec/dist/typechain-types/index.js";
import { zBreakoutMintRequest, zPropType } from "../fractal.js";
import { expect } from "chai";
import { unpackTokenId } from "respect1155-sc/dist/utils/tokenId.js";
import { zCustomSignalType, zSignalArgs, zTickSignalType } from "../orec.js";

export const zNPropContext = z.instanceof(ORContext);
export type NPropContext = z.infer<typeof zNPropContext>;

export const zNProposalInContext = z.object({
  ctx: zNPropContext,
  prop: zNProposal
});
export type NProposalInContext = z.infer<typeof zNProposalInContext>;

export const zNProposalFullInContext = zNProposalInContext.extend({
  prop: zNProposalFull
});

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

export const zNProposalToRespectBreakout = zNProposalFullInContext.transform(async (val, ctx) => {
  try {
    const attachment = zRespectBreakoutAttachment.parse(val.prop.attachment);

    expect(val.prop.content.addr).to.be.equal(
      await val.ctx.getNewRespectAddr(),
      "respect breakout message expected to be addressed to newRespectAddr"
    );

    const data = zBytesLikeToBytes.parse(val.prop.content.cdata);
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

export const zNProposalToRespectAccount = zNProposalFullInContext.transform(async (val, ctx) => {
  try {
    const attachment = zRespectAccountAttachment.parse(val.prop.attachment);

    expect(val.prop.content.addr).to.be.equal(
      await val.ctx.getNewRespectAddr(),
      "respect breakout message expected to be addressed to newRespectAddr"
    );

    const data = zBytesLikeToBytes.parse(val.prop.content.cdata);
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
      metadata: zNAttachmentToMetadata.parse(attachment)
    }

    return r;
  } catch(err) {
    addCustomIssue(val, ctx, err, "Exception in zNProposalToRespectAccount");
  }
}).pipe(zRespectAccount);


export const zNProposalToBurnRespect = zNProposalFullInContext.transform(async (val, ctx) => {
  try {
    const attachment = zBurnRespectAttachment.parse(val.prop.attachment);

    expect(val.prop.content.addr).to.be.equal(
      await val.ctx.getNewRespectAddr(),
      "respect account message expected to be addressed to newRespectAddr"
    );

    const data = zBytesLikeToBytes.parse(val.prop.content.cdata);
    const tx = respectInterface.parseTransaction({ data });
    expect(tx?.name).to.be.equal(
      respectInterface.getFunction('burnRespect').name,
      "expected burnRespect function to be called"
    );

    const args = zBurnRespectArgs.parse(tx?.args);

    const tdata = zTokenIdData.parse(unpackTokenId(args.tokenId));

    const r: BurnRespect = {
      propType: zPropType.Enum.burnRespect,
      tokenId: args.tokenId,
      reason: attachment.burnReason,
      metadata: zNAttachmentToMetadata.parse(attachment)
    }

    return r;
  } catch(err) {
    addCustomIssue(val, ctx, err, "Exception in zProposalToBurnRespect");
  }
}).pipe(zBurnRespect);

export const zNProposalToCustomSignal = zNProposalFullInContext.transform(async (val, ctx) => {
  try {
    const attachment = zCustomSignalAttachment.parse(val.prop.attachment);

    expect(val.prop.content.addr).to.be.equal(
      await val.ctx.getOrecAddr(),
      "custom signal supposed to be addressed to orec"
    );

    const data = zBytesLikeToBytes.parse(val.prop.content.cdata);
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

export const zNProposalToTick = zNProposalFullInContext.transform(async (val, ctx) => {
  try {
    const attachment = zTickAttachment.parse(val.prop.attachment);

    expect(val.prop.content.addr).to.be.equal(
      await val.ctx.getOrecAddr(),
      "custom signal supposed to be addressed to orec"
    );

    const data = zBytesLikeToBytes.parse(val.prop.content.cdata);
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

export const zNProposalToCustomCall = zNProposalFullInContext.transform(async (val, ctx) => {
  try{
    const attachment = zCustomCallAttachment.parse(val.prop.attachment);

    const r: CustomCall = {
      cdata: zBytesLikeToBytes.parse(val.prop.content.cdata),
      address: val.prop.content.addr,
      propType: zPropType.Enum.customCall,
      metadata: zNAttachmentToMetadata.parse(attachment)
    }

    return r;
  } catch(err) {
    addCustomIssue(val, ctx, err, "Exception in zNProposalToCustomCall")
  }
});


export const zProposalToDecodedProp = zNProposalFullInContext.transform(async (val, ctx) => {
  if (val.prop.attachment !== undefined && val)
  switch (val.prop.attachment.propType) {
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
    default:
      const exhaustiveCheck: never = val.prop.attachment;
      addCustomIssue(val, ctx, "Exhaustiveness check failed in zProposalToDecodedProp");
  }
}).pipe(zDecodedProposal);

export const zNPropToProp = zNProposalInContext.transform(async (nodeProp, ctx) => {
  try {
    const propId = nodeProp.prop.id;
    const onchainProp = await nodeProp.ctx.getProposalFromChain(propId);
    const rProp: Proposal = onchainProp;

    if (nodeProp.prop.content !== undefined) {
      rProp.addr = nodeProp.prop.content.addr;
      rProp.cdata = nodeProp.prop.content.cdata;
      rProp.memo = nodeProp.prop.content.memo;
      if (nodeProp.prop.attachment !== undefined) {
        rProp.decoded = await zProposalToDecodedProp.parseAsync(nodeProp);
      }
    }

    return rProp;
  } catch (err) {
    addCustomIssue(nodeProp, ctx, err, "Error in zProposalToClientProp");
  }
}).pipe(zProposal);


export class NodeToClientTransformer {
  private _pctx: NPropContext;

  constructor(context: NPropContext) {
    this._pctx = context;
  }

  toContext(prop: NProposal): NProposalInContext {
    return {
      ctx: this._pctx,
      prop
    };
  }

  async transformProp(prop: NProposal): Promise<Proposal> {
    return await zNPropToProp.parseAsync(this.toContext(prop));
  }
}