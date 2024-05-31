import { z } from "zod";
import {
  BurnRespectRequest,
  RespectAccountRequest,
  RespectBreakoutRequest,
  zBreakoutResult,
  zBurnRespectRequest,
  zRespectAccountRequest,
  zRespectBreakoutRequest,
} from "../orclientTypes.js";
import { BurnRespect, BurnRespectAttachment, PropContent, Proposal, RespectAccount, RespectAccountAttachment, RespectBreakout, RespectBreakoutAttachment, zBurnRespect, zRespectAccount, zRespectBreakout } from "../ornodeTypes.js";
import { ORContext } from "../orContext.js";
import { BurnRespectArgs, MintRequest, MintRespectArgs, MintRespectGroupArgs, zBigNumberish, zBigNumberishToBigint, zBreakoutMintType, zGroupNum, zMintRespectArgs, zMintRespectGroupArgs, zPropType, zRankNum, zUnspecifiedMintType } from "../common.js";
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

export const zRespBreakoutReqCtx = z.object({
  ctx: zCPropContext,
  req: zRespectBreakoutRequest
});

export const zRespAccountReqCtx = z.object({
  ctx: zCPropContext,
  req: zRespectAccountRequest
});

export const zBurnRespectReqCtx = z.object({
  ctx: zCPropContext,
  req: zBurnRespectRequest
});

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

export function idOfRespectBreakoutAttach(attachment: RespectBreakoutAttachment) {
  const a: Required<RespectBreakoutAttachment> = {
    ...attachment,
    propTitle: attachment.propTitle ?? "",
    propDescription: attachment.propDescription ?? "",
    salt: attachment.salt ?? ""
  };

  return solidityPackedKeccak256(
    [ "string", "string", "string", "string", "uint" ],
    [ a.propType, a.propTitle, a.propDescription, a.salt, a.groupNum ]
  );
}

export function idOfRespectAccountAttach(attachment: RespectAccountAttachment) {
  const a: Required<RespectAccountAttachment> = {
    ...attachment,
    propTitle: attachment.propTitle ?? "",
    propDescription: attachment.propDescription ?? "",
    salt: attachment.salt ?? ""
  };

  return solidityPackedKeccak256(
    [ "string", "string", "string", "string", "string", "string" ],
    [ a.propType, a.propTitle, a.propDescription, a.salt, a.mintReason, a.mintTitle ]
  );
}

export function idOfBurnRespectAttach(attachment: BurnRespectAttachment) {
  const a: Required<BurnRespectAttachment> = {
    ...attachment,
    propTitle: attachment.propTitle ?? "",
    propDescription: attachment.propDescription ?? "",
    salt: attachment.salt ?? ""
  };

  return solidityPackedKeccak256(
    [ "string", "string", "string", "string", "string" ],
    [ a.propType, a.propTitle, a.propDescription, a.salt, a.burnReason ]
  );
}

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
}).pipe(zRespectBreakout);

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
}).pipe(zRespectAccount);

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
}).pipe(zBurnRespect);

export class ClientToNodeTransformer {
  private _cctx: CPropContext

  constructor(context: CPropContext) {
    this._cctx = context;
  }

  async transformRespectBreakout(req: RespectBreakoutRequest): Promise<Proposal> {
    const c = { ctx: this._cctx, req };
    return await zCRespBreakoutReqToProposal.parseAsync(c);
  }

  async tranformRespectAccount(req: RespectAccountRequest): Promise<Proposal> {
    const c = { ctx: this._cctx, req };
    return await zCRespAccountReqToProposal.parseAsync(c);
  }

  async transformBurnRespect(req: BurnRespectRequest): Promise<Proposal> {
    const c = { ctx: this._cctx, req };
    return await zCBurnRespReqToProposal.parseAsync(c);
  }
}