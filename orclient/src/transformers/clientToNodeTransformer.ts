import { z } from "zod";
import {
  RespectBreakoutRequest,
  zBreakoutResult,
  zRespectAccountRequest,
  zRespectBreakoutRequest,
} from "../orclientTypes.js";
import { PropContent, Proposal, RespectBreakout, RespectBreakoutAttachment, zRespectBreakout } from "../ornodeTypes.js";
import { ORContext } from "../orContext.js";
import { MintRequest, MintRespectGroupArgs, zBigNumberish, zBigNumberishToBigint, zBreakoutMintType, zGroupNum, zMintRespectGroupArgs, zPropType } from "../common.js";
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

const _rewards = [
  55n, 34n, 21n, 13n, 8n, 5n
];

export const zRankingToValue = z.number().transform((rank, ctx) => {
  try {
    const rankIndex = rank - 1;
    expect(rankIndex).to.be.lt(_rewards.length).gte(0);
    return _rewards[rankIndex];
  } catch (err) {
    addIssue(ctx, `${err}`);
  }
}).pipe(zBigNumberish.gt(0n));

export const zCRespectBreakoutToMintArgs = zRespBreakoutReqCtx.transform(async (val, ctx) => {
  try {
    const periodNumber = val.req.meetingNum === undefined
      ? await val.ctx.ornode.getPeriodNum() + 1
      : val.req.meetingNum;

    const mintReqs: MintRequest[] = [];

    for (const [i, addr] of val.req.rankings.entries()) {
      const value = zRankingToValue.parse(6 - i);
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

export const zCRespBreakoutReqToProposal = zRespBreakoutReqCtx.transform(async (val, ctx) => {
  try {
    const mintArgs = await zCRespectBreakoutToMintArgs.parseAsync(val);
    const cdata = respectInterface.encodeFunctionData(
      "mintRespectGroup",
      [mintArgs.mintRequests, mintArgs.data]
    );
    const addr = await val.ctx.getNewRespectAddr();

    const attachment: RespectBreakoutAttachment= {
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

export const zCRespAccountReqToProposal = zRespAccountReqCtx.transform(async (val, ctx) => {
  try {
    const mintArgs = await zCRespectBreakoutToMintArgs.parseAsync(val);
    const cdata = respectInterface.encodeFunctionData(
      "mintRespect",
      [mintArgs.mintRequests, mintArgs.data]
    );
    const addr = await val.ctx.getNewRespectAddr();

    const attachment: RespectBreakoutAttachment= {
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

});

export class ClientToNodeTransformer {
  private _cctx: CPropContext

  constructor(context: CPropContext) {
    this._cctx = context;
  }

  async transformRespectBreakout(req: RespectBreakoutRequest): Promise<Proposal> {
    const c = { ctx: this._cctx, req };
    return await zCRespBreakoutReqToProposal.parseAsync(req);
  }
}