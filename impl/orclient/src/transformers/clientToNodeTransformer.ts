import { ZodType, ZodTypeAny, z } from "zod";
import {
  BurnRespectRequest,
  CustomCallRequest,
  CustomSignalRequest,
  RespectAccountRequest,
  RespectBreakoutRequest,
  TickRequest,
  zBreakoutResult,
  zBurnRespectRequest,
  zCustomCallRequest,
  zCustomSignalRequest,
  zRespectAccountRequest,
  zRespectBreakoutRequest,
  zTickRequest,
} from "../orclientTypes.js";
import { BurnRespect, BurnRespectAttachment, CustomCall, CustomCallAttachment, CustomSignal, CustomSignalAttachment, PropContent, Proposal, RespectAccount, RespectAccountAttachment, RespectBreakout, RespectBreakoutAttachment, Tick, TickAttachment, TickValid, idOfBurnRespectAttach, idOfCustomCallAttach, idOfCustomSignalAttach, idOfRespectAccountAttach, idOfRespectBreakoutAttach, zBurnRespect, zBurnRespectValid, zCustomCall, zCustomCallValid, zCustomSignal, zCustomSignalValid, zRespectAccount, zRespectAccountValid, zRespectBreakout, zRespectBreakoutValid, zTick, zTickValid } from "../ornodeTypes.js";
import { ORContext } from "../orContext.js";
import { BurnRespectArgs, CustomSignalArgs, KnownSignalTypes, MintRequest, MintRespectArgs, MintRespectGroupArgs, zBigNumberish, zBigNumberishToBigint, zBreakoutMintType, zGroupNum, zMintRespectArgs, zMintRespectGroupArgs, zPropType, zRankNum, zTickSignalType, zUnspecifiedMintType } from "../common.js";
import { expect } from "chai";
import { packTokenId } from "respect-sc/utils/tokenId.js";
import { addIssue } from "./common.js";
import { Respect1155__factory } from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import { Orec__factory } from "orec/typechain-types/index.js";
import { keccak256, solidityPackedKeccak256 } from "ethers";
import { propId } from "orec/utils/index.js";

const respectInterface = Respect1155__factory.createInterface();
const orecInterface = Orec__factory.createInterface();

export const zCPropContext = z.instanceof(ORContext);
export type CPropContext = z.infer<typeof zCPropContext>;

type RequestWithContext<T extends ZodType> = z.ZodObject<{
  ctx: z.ZodType<ORContext, z.ZodTypeDef, ORContext>,
  req: T
}>;
function zReqToContext<T extends ZodType>(ztype: T): RequestWithContext<T> {
  return z.object({ ctx: zCPropContext, req: ztype });
}

export const zRespBreakoutReqCtx = zReqToContext(zRespectBreakoutRequest);
export const zRespAccountReqCtx = zReqToContext(zRespectAccountRequest);
export const zBurnRespectReqCtx = zReqToContext(zBurnRespectRequest);
export const zCustomSignalReqCtx = zReqToContext(zCustomSignalRequest);
export const zTickReqCtx = zReqToContext(zTickRequest);
export const zCustomCallReqCtx = zReqToContext(zCustomCallRequest);

const _rewards = [
  55n, 34n, 21n, 13n, 8n, 5n
];

export const zRankNumToValue = zRankNum.transform((rankNum, ctx) => {
  try {
    const rankIndex = rankNum - 1;
    return _rewards[rankIndex];
  } catch (err) {
    addIssue(ctx, `${err}`);
  }
}).pipe(zBigNumberish.gt(0n));

// TODO: use ipfs cids instead?
//  * propIds can use solidityPacked for efficiency but it makes sense to adapt attachments more for off-chain?

export const zCRespectBreakoutToMintArgs = zRespBreakoutReqCtx.transform(async (val, ctx) => {
  try {
    const periodNumber = val.req.meetingNum === undefined
      ? await val.ctx.ornode.getPeriodNum()
      : val.req.meetingNum - 1;

    const mintReqs: MintRequest[] = [];

    for (const [i, addr] of val.req.rankings.entries()) {
      const value = zRankNumToValue.parse(6 - i);
      const id = packTokenId({
        owner: addr,
        mintType: zBreakoutMintType.value,
        periodNumber
      })
      mintReqs.push({
        value, id: zBigNumberishToBigint.parse(id)
      });
    }

    const r: MintRespectGroupArgs = {
      mintRequests: mintReqs,
      data: ""
    }
    return r;
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zMintRespectGroupArgs);

export const zCRespBreakoutReqToProposal = zRespBreakoutReqCtx.transform(async (val, ctx) => {
  try {
    const mintArgs = await zCRespectBreakoutToMintArgs.parseAsync(val);
    const cdata = respectInterface.encodeFunctionData(
      "mintRespectGroup",
      [mintArgs.mintRequests, mintArgs.data]
    );
    const addr = await val.ctx.getNewRespectAddr();

    const attachment: RespectBreakoutAttachment = {
      propType: zPropType.Enum.respectBreakout,
      groupNum: zGroupNum.parse(val.req.groupNum),
    };

    const memo = idOfRespectBreakoutAttach(attachment);

    const content: PropContent = { addr, cdata, memo };
    const id = propId(content);

    const r: RespectBreakout = {
      id,
      content,
      attachment
    }
    return r;
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zRespectBreakoutValid);

export const zCRespectAccountReqToMintArgs = zRespAccountReqCtx.transform(async (val, ctx) => {
  try {
    const periodNumber = val.req.meetingNum === undefined
      ? await val.ctx.ornode.getPeriodNum()
      : val.req.meetingNum - 1;
    const mintType = val.req.mintType === undefined
      ? zUnspecifiedMintType.value
      : val.req.mintType;

    const id = packTokenId({
      owner: val.req.account,
      mintType,
      periodNumber
    });

    const mintReq: MintRequest = {
      id: zBigNumberishToBigint.parse(id),
      value: val.req.value
    };

    const r: MintRespectArgs = {
      request: mintReq,
      data: ""
    };

    return r;
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zMintRespectArgs);

export const zCRespAccountReqToProposal = zRespAccountReqCtx.transform(async (val, ctx) => {
  try {
    const mintArgs = await zCRespectAccountReqToMintArgs.parseAsync(val);
    const cdata = respectInterface.encodeFunctionData(
      "mintRespect",
      [mintArgs.request, mintArgs.data]
    );
    const addr = await val.ctx.getNewRespectAddr();

    const attachment: RespectAccountAttachment = {
      propType: zPropType.Enum.respectAccount,
      mintReason: val.req.reason,
      mintTitle: val.req.title,
      propTitle: val.req.metadata?.propTitle,
      propDescription: val.req.metadata?.propDescription
    };

    const memo = idOfRespectAccountAttach(attachment);

    const content: PropContent = { addr, cdata, memo };
    const id = propId(content);

    const r: RespectAccount = {
      id,
      content,
      attachment
    }
    return r;
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zRespectAccountValid);

export const zCBurnRespReqToProposal = zBurnRespectReqCtx.transform(async (val, ctx) => {
  try {
    const args: BurnRespectArgs = {
      tokenId: val.req.tokenId,
      data: ""
    };
    const cdata = respectInterface.encodeFunctionData(
      "burnRespect",
      [args.tokenId, args.data]
    );
    const addr = await val.ctx.getNewRespectAddr();

    const attachment: BurnRespectAttachment = {
      propType: zPropType.Enum.burnRespect,
      burnReason: val.req.reason, 
      propTitle: val.req.metadata?.propTitle,
      propDescription: val.req.metadata?.propDescription
    };

    const memo = idOfBurnRespectAttach(attachment);

    const content: PropContent = { addr, cdata, memo };
    const id = propId(content);

    const r: BurnRespect = {
      id,
      content,
      attachment
    }
    return r;
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zBurnRespectValid);

export const zCCustomSignalReqToProposal = zCustomSignalReqCtx.transform(async (val, ctx) => {
  try {
    const args: CustomSignalArgs = {
      signalType: val.req.signalType,
      data: val.req.data
    };
    const cdata = orecInterface.encodeFunctionData(
      "signal",
      [args.signalType, args.data]
    );
    const addr = await val.ctx.getOrecAddr();

    const attachment: CustomSignalAttachment = {
      propType: zPropType.Enum.customSignal,
      link: val.req.link,
      propTitle: val.req.metadata?.propTitle,
      propDescription: val.req.metadata?.propDescription
    };

    const memo = idOfCustomSignalAttach(attachment);

    const content: PropContent = { addr, cdata, memo };
    const id = propId(content);

    const r: CustomSignal = {
      id,
      content,
      attachment
    }
    return r;
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zCustomSignalValid);

export const zCTickReqToProposal = zTickReqCtx.transform(async (val, ctx) => {
  try {
    const args: CustomSignalArgs = {
      signalType: zTickSignalType.value,
      data: val.req.data === undefined ? "" : val.req.data
    };
    const cdata = orecInterface.encodeFunctionData(
      "signal",
      [args.signalType, args.data]
    );
    const addr = await val.ctx.getOrecAddr();

    const attachment: TickAttachment = {
      propType: zPropType.Enum.tick,
      link: val.req.link,
      propTitle: val.req.metadata?.propTitle,
      propDescription: val.req.metadata?.propDescription
    };

    const memo = idOfCustomSignalAttach(attachment);

    const content: PropContent = { addr, cdata, memo };
    const id = propId(content);

    const r: Tick = {
      id,
      content,
      attachment
    }
    return r;
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zTickValid);

export const zCCustomCallReqToProposal = zCustomCallReqCtx.transform(async (val, ctx) => {
  try {
    const attachment: CustomCallAttachment = {
      propType: zPropType.Enum.customCall
    };

    const memo = idOfCustomCallAttach(attachment);

    const content: PropContent = { 
      addr: val.req.address,
      cdata: val.req.cdata,
      memo
    };
    const id = propId(content);

    const r: CustomCall = {
      id,
      content,
      attachment
    }
    return r;
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zCustomCallValid);

export class ClientToNodeTransformer {
  private _cctx: CPropContext

  constructor(context: CPropContext) {
    this._cctx = context;
  }

  async transformRespectBreakout(req: RespectBreakoutRequest): Promise<RespectBreakout> {
    const c = { ctx: this._cctx, req };
    return await zCRespBreakoutReqToProposal.parseAsync(c);
  }

  async tranformRespectAccount(req: RespectAccountRequest): Promise<RespectAccount> {
    const c = { ctx: this._cctx, req };
    return await zCRespAccountReqToProposal.parseAsync(c);
  }

  async transformBurnRespect(req: BurnRespectRequest): Promise<BurnRespect> {
    const c = { ctx: this._cctx, req };
    return await zCBurnRespReqToProposal.parseAsync(c);
  }

  async transformCustomSignal(req: CustomSignalRequest): Promise<CustomSignal> {
    const c = { ctx: this._cctx, req };
    return await zCCustomSignalReqToProposal.parseAsync(c);
  }

  async transformTick(req: TickRequest): Promise<TickValid> {
    const c = { ctx: this._cctx, req };
    return await zCTickReqToProposal.parseAsync(c);
  }

  async transformCustomCall(req: CustomCallRequest): Promise<CustomCall> {
    const c = { ctx: this._cctx, req };
    return await zCCustomCallReqToProposal.parseAsync(c);
  }

}