import { Respect1155__factory } from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import {
  RespectBreakout,
  zBreakoutResult,
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
} from "../orclientTypes.js";
import {
  zProposal as zNProposal,
  zRespectBreakout as zNRespectBreakout,
  zRespectAccount as zNRespectAccount,
  Proposal as NProposal,
  zProposalFull as zNProposalFull,
  zRespectBreakoutAttachment,
  zRespectAccountAttachment,
  zBurnRespectAttachment,
  zCustomSignalAttachment,
  zPropAttachmentBase,
  zCustomCallAttachment,
  zTickAttachment,
} from "../ornodeTypes.js";
import {
  EthAddress,
  MeetingNum,
  PropType,
  zBurnRespectArgs,
  zBytesLikeToBytes,
  zSignalArgs,
  zEthAddress,
  zMeetingNum,
  zMintRespectArgs,
  zMintRespectGroupArgs,
  zMintType,
  zPropType,
  zRankings,
  zTokenIdData,
  zBigNumberishToBigint,
  zCustomSignalType,
  zTickSignalType
} from "../common.js";
import { z, RefinementCtx } from "zod";
import { unpackTokenId } from "respect-sc/utils/tokenId.js";
import { expect } from "chai";
import { BigNumberish, ZeroAddress } from "ethers";
import { Provider } from "ethers";
import { Orec, Orec__factory } from "orec/typechain-types/index.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { FractalRespect } from "op-fractal-sc/typechain-types/contracts/FractalRespect.js";
import { ORContext } from "../orContext.js";
import { token } from "orec/typechain-types/@openzeppelin/contracts/index.js";
import { addIssue } from "./common.js";

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
}).pipe(zProposalMetadata);

const respectInterface = Respect1155__factory.createInterface();
const orecInterface = Orec__factory.createInterface();

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
      addIssue(ctx, "value is not equal to any of possible breakout group rewards");
      return NaN;
    }
  }
});

export const zMintArgsToRespectBreakout = zMintRespectGroupArgs.transform((val, ctx) => {
  try {
    expect(val.mintRequests.length).to.be.greaterThanOrEqual(3).and.to.be.lessThanOrEqual(6);

    const rankings: EthAddress[] = [];
    let meetingNum: MeetingNum | undefined;

    for (const [i, req] of val.mintRequests.entries()) {
      const rankingFromVal = zValueToRanking.parse(req.value);  
      expect(rankingFromVal).to.be.equal(6 - i);

      const tokenIdData = unpackTokenId(req.id);
      expect(tokenIdData.mintType).to.be.equal(0);
      expect(tokenIdData.owner).to.be.not.equal(ZeroAddress);
      const periodNum = zBigNumberishToBigint.parse(tokenIdData.periodNumber); 
      if (meetingNum === undefined) {
        meetingNum = zMeetingNum.parse(periodNum + 1n);
      } else {
        expect(periodNum + 1n).to.be.equal(BigInt(meetingNum));
      }
      rankings.push(tokenIdData.owner);
    }
    
    if (meetingNum !== undefined) {
      const r: RespectBreakout = {
        propType: zPropType.Enum.respectBreakout,
        meetingNum: meetingNum,
        rankings,
        groupNum: 0,
        mintData: zBytesLikeToBytes.parse(val.data),
        metadata: {}
      };
      return r;
    }
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zRespectBreakout);

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
    const args = zMintRespectGroupArgs.parse(tx?.args);
    const respectBreakout = zMintArgsToRespectBreakout.parse(args);
    respectBreakout.groupNum = attachment.groupNum;
    respectBreakout.metadata = zNAttachmentToMetadata.parse(attachment)

    return respectBreakout;
  } catch(err) {
    addIssue(ctx, `Exception in zProposalToRespectBreakout: ${err}`);
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
    addIssue(ctx, `Exception in zProposalToRespectAccount: ${err}`)
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
    addIssue(ctx, `Exception in zProposalToBurnRespect: ${err}`)
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
    addIssue(ctx, `Exception in zNProposalToCustomSignal: ${err}`)
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
    addIssue(ctx, `Exception in zNProposalToTick: ${err}`)
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
    addIssue(ctx, `Exception in zNProposalToCustomCall: ${err}`)
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
      break;
  }
}).pipe(zDecodedProposal);

export const zNPropToProp = zNProposalInContext.transform(async (nodeProp, ctx) => {
  try {
    const propId = nodeProp.prop.id;
    const onchainProp = await nodeProp.ctx.getProposalFromChain(propId);
    const rProp: Proposal = onchainProp;

    if (nodeProp.prop.content !== undefined && nodeProp.prop.attachment !== undefined) {
      rProp.addr = nodeProp.prop.content.addr;
      rProp.cdata = nodeProp.prop.content.cdata;
      rProp.memo = nodeProp.prop.content.memo;
      rProp.decoded = await zProposalToDecodedProp.parseAsync(nodeProp);
    }

    return rProp;
  } catch (err) {
    addIssue(ctx, `Error in zProposalToClientProp: ${err}`);
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