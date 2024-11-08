import { ZodIssueCode, ZodType, ZodTypeAny, z } from "zod";
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
  zVoteType as zCVoteType,
  VoteType as CVoteType,
  GetProposalsSpec as CGetProposalsSpec,
  zGetProposalsSpec as zCGetProposalsSpec,
  zGetAwardsSpec as zCGetAwardsSpec,
  GetAwardsSpec as CGetAwardsSpec,
  zGetVotesSpec as zCGetVotesSpec,
  GetVotesSpec as CGetVotesSpec,
} from "../orclient.js";
import { BurnRespect, BurnRespectAttachment, CustomCall, CustomCallAttachment, CustomSignal, CustomSignalAttachment, PropContent, Proposal, RespectAccount, RespectAccountAttachment, RespectBreakout, RespectBreakoutAttachment, Tick, TickAttachment, TickValid, idOfBurnRespectAttach, idOfCustomCallAttach, idOfCustomSignalAttach, idOfRespectAccountAttachV1, idOfRespectBreakoutAttach, zBurnRespect, zBurnRespectValid, zCustomCall, zCustomCallValid, zCustomSignal, zCustomSignalValid, zRespectAccount, zRespectAccountValid, zRespectBreakout, zRespectBreakoutValid, zTick, zTickValid, zGetProposalsSpec, GetProposalsSpec, zGetAwardsSpec, GetAwardsSpec, GetVotesSpec, zGetVotesSpec } from "../ornode.js";
import { ConfigWithOrnode, ORContext as OrigORContext } from "../orContext.js";
import { CustomSignalArgs, OrecFactory, zTickSignalType, zVoteType, VoteType, strToVtMap, zStrToVoteType } from "../orec.js";
import { BurnRespectArgs, MintRequest, MintRespectArgs, MintRespectGroupArgs, Factory as Respect1155Factory, zBreakoutMintType, zMintRespectArgs, zUnspecifiedMintType } from "../respect1155.js";
import { propId } from "orec/utils";
import { addCustomIssue } from "../zErrorHandling.js";
import { zBreakoutMintRequest, zGroupNum, zPropType, zRankNum } from "../fractal.js";
import { zBigNumberish, zBigNumberishToBigint } from "../eth.js";
import { packTokenId } from "respect1155/utils/tokenId.js";

type ORContext = OrigORContext<ConfigWithOrnode>;

const respectInterface = Respect1155Factory.createInterface();
const orecInterface = OrecFactory.createInterface();

const _rewards = [
  55n, 34n, 21n, 13n, 8n, 5n
];

export const zRankNumToValue = zRankNum.transform((rankNum, ctx) => {
  try {
    const rankIndex = rankNum - 1;
    return _rewards[rankIndex];
  } catch (err) {
    addCustomIssue(rankNum, ctx, err, "exception in zRankNumToValue");
  }
}).pipe(zBigNumberish.gt(0n));

export const clientToOrecVoteMap = strToVtMap;

export const zCVoteTypeToOrec = zStrToVoteType;

function mkzCRespectBreakoutToMintArgs(orctx: ORContext) {
  return zRespectBreakoutRequest.transform(async (val, ctx) => {
    try {
      const periodNumber = val.meetingNum === undefined
        ? await orctx.ornode.getPeriodNum()
        : val.meetingNum - 1;

      const mintReqs: MintRequest[] = [];

      for (const [i, addr] of val.rankings.entries()) {
        const value = zRankNumToValue.parse(i + 1);
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
        data: "0x"
      }
      return r;
    } catch (err) {
      // TODO: pass the parent err in some way, instead of passing it through message...
      addCustomIssue(val, ctx, err, "exception in zCRespectBreakoutToMintArgs");
    }
  }).pipe(zBreakoutMintRequest);
}

function mkzCRespectBreakoutToProposal(orctx: ORContext) {
  const _zCRespectBreakoutToMintArgs = mkzCRespectBreakoutToMintArgs(orctx);

  return zRespectBreakoutRequest.transform(async (val, ctx) => {
    try {
      const mintArgs = await _zCRespectBreakoutToMintArgs.parseAsync(val);
      const cdata = respectInterface.encodeFunctionData(
        "mintRespectGroup",
        [mintArgs.mintRequests, mintArgs.data]
      );
      const addr = await orctx.getNewRespectAddr();

      const attachment: RespectBreakoutAttachment = {
        propType: zPropType.Enum.respectBreakout,
        groupNum: zGroupNum.parse(val.groupNum),
        propTitle: val.metadata?.propTitle,
        propDescription: val.metadata?.propDescription
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
      addCustomIssue(val, ctx, {
        message: "exception in zCRespectBreakoutReqToProposal",
        cause: err
      });
    }
  }).pipe(zRespectBreakoutValid);
}

function mkzCRespectAccountReqToMintArgs(orctx: ORContext) {
  return zRespectAccountRequest.transform(async (val, ctx) => {
    try {
      const periodNumber = val.meetingNum === undefined
        ? await orctx.ornode.getPeriodNum()
        : val.meetingNum - 1;
      const mintType = val.mintType === undefined
        ? zUnspecifiedMintType.value
        : val.mintType;

      const id = packTokenId({
        owner: val.account,
        mintType,
        periodNumber
      });

      const mintReq: MintRequest = {
        id: zBigNumberishToBigint.parse(id),
        value: val.value
      };

      const r: MintRespectArgs = {
        request: mintReq,
        data: "0x"
      };

      return r;
    } catch (err) {
      addCustomIssue(val, ctx, {
        message: "exception in zCRespectAccountReqToMintArgs",
        cause: err
      });
    }
  }).pipe(zMintRespectArgs);
}

function mkzCRespAccountReqToProposal(orctx: ORContext) {
  const _zCRespectAccountReqToMintArgs = mkzCRespectAccountReqToMintArgs(orctx);

  return zRespectAccountRequest.transform(async (val, ctx) => {
    try {
      const mintArgs = await _zCRespectAccountReqToMintArgs.parseAsync(val);
      const cdata = respectInterface.encodeFunctionData(
        "mintRespect",
        [mintArgs.request, mintArgs.data]
      );
      const addr = await orctx.getNewRespectAddr();

      const attachment: RespectAccountAttachment = {
        propType: zPropType.Enum.respectAccount,
        mintReason: val.reason,
        mintTitle: val.title,
        propTitle: val.metadata?.propTitle,
        propDescription: val.metadata?.propDescription,
        groupNum: val.groupNum,
        version: 2
      };

      const memo = idOfRespectAccountAttachV1(attachment);

      const content: PropContent = { addr, cdata, memo };
      const id = propId(content);

      const r: RespectAccount = {
        id,
        content,
        attachment
      }
      return r;
    } catch (err) {
      addCustomIssue(val, ctx, {
        message: "exception in zCRespectAccountReqToProposal",
        cause: err
      });
    }
  }).pipe(zRespectAccountValid);
}

function mkzCBurnRespReqToProposal(orctx: ORContext) {
  return zBurnRespectRequest.transform(async (val, ctx) => {
    try {
      const args: BurnRespectArgs = {
        tokenId: zBigNumberishToBigint.parse((val.tokenId)),
        data: "0x"
      };
      const cdata = respectInterface.encodeFunctionData(
        "burnRespect",
        [args.tokenId, args.data]
      );
      const addr = await orctx.getNewRespectAddr();

      const attachment: BurnRespectAttachment = {
        propType: zPropType.Enum.burnRespect,
        burnReason: val.reason, 
        propTitle: val.metadata?.propTitle,
        propDescription: val.metadata?.propDescription
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
      addCustomIssue(val, ctx, {
        message: "exception in zCBurnRespReqToProposal",
        cause: err
      });
    }
  }).pipe(zBurnRespectValid);
}

function mkzCCustomSignalReqToProposal(orctx: ORContext) {
  return zCustomSignalRequest.transform(async (val, ctx) => {
    try {
      const args: CustomSignalArgs = {
        signalType: val.signalType,
        data: val.data
      };
      const cdata = orecInterface.encodeFunctionData(
        "signal",
        [args.signalType, args.data]
      );
      const addr = await orctx.getOrecAddr();

      const attachment: CustomSignalAttachment = {
        propType: zPropType.Enum.customSignal,
        link: val.link,
        propTitle: val.metadata?.propTitle,
        propDescription: val.metadata?.propDescription
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
      addCustomIssue(val, ctx, {
        message: "exception in zCCustomSignalReqToProposal",
        cause: err
      });
    }
  }).pipe(zCustomSignalValid);
}

function mkzTickReqToProposal(orctx: ORContext) {
  return zTickRequest.transform(async (val, ctx) => {
    try {
      const args: CustomSignalArgs = {
        signalType: zTickSignalType.value,
        data: val.data === undefined ? "0x" : val.data
      };
      const cdata = orecInterface.encodeFunctionData(
        "signal",
        [args.signalType, args.data]
      );
      const addr = await orctx.getOrecAddr();

      const attachment: TickAttachment = {
        propType: zPropType.Enum.tick,
        link: val.link,
        propTitle: val.metadata?.propTitle,
        propDescription: val.metadata?.propDescription
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
      addCustomIssue(val, ctx, {
        message: "exception in zCTickReqToProposal",
        cause: err
      });
    }
  }).pipe(zTickValid);
}

function mkzCCustomCallReqToProposal(orctx: ORContext) {
  return zCustomCallRequest.transform(async (val, ctx) => {
    try {
      const attachment: CustomCallAttachment = {
        propType: zPropType.Enum.customCall,
        propTitle: val.metadata?.propTitle,
        propDescription: val.metadata?.propDescription
      };

      const memo = idOfCustomCallAttach(attachment);

      const content: PropContent = { 
        addr: val.address,
        cdata: val.cdata,
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
      addCustomIssue(val, ctx, {
        message: "exception in zCCustomCallReqToProposal",
        cause: err
      });
    }
  }).pipe(zCustomCallValid);
}

// zCGetProposalSepc is strict, so this checks that no unknown fields are specified
export const zCGetProposalsSpecToNodeSpec = zCGetProposalsSpec.transform(spec => {
  const r: GetProposalsSpec = {
    before: spec.before !== undefined ? spec.before.valueOf() / 1000 : undefined,
    limit: spec.limit,
    execStatusFilter: spec.execStatFilter
  }
  return r;
}).pipe(zGetProposalsSpec);

export const zCGetAwardsSpecToNodeSpec = zCGetAwardsSpec.transform(spec => {
  const r: GetAwardsSpec = {
    ...spec,
    before: spec.before !== undefined ? spec.before.valueOf() / 1000 : undefined
  }
  return r;
}).pipe(zGetAwardsSpec);

export const zCGetVotesSpecToNodeSpec = zCGetVotesSpec.transform(spec => {
  const r: GetVotesSpec = {
    ...spec,
    before: spec.before !== undefined ? spec.before.valueOf() / 1000 : undefined,
  }
  return r;
}).pipe(zGetVotesSpec); 

// const zCGetProposalsSpecToNode = zCGetProposalsSpec.transform(spec => {
//   const nspec: GetProposalsSpec = {
//     untilTime: spec.untilTime
//   }
// })

export class ClientToNodeTransformer {
  private _ctx: ORContext
  private _zCRespBreakoutReqToProposal: ReturnType<typeof mkzCRespectBreakoutToProposal>;
  private _zCRespAccountReqToProposal: ReturnType<typeof mkzCRespAccountReqToProposal>
  private _zCBurnRespReqToProposal: ReturnType<typeof mkzCBurnRespReqToProposal>;
  private _zCCustomSignalReqToProposal: ReturnType<typeof mkzCCustomSignalReqToProposal>;
  private _zCTickReqToProposal: ReturnType<typeof mkzTickReqToProposal>;
  private _zCCustomCallReqToProposal: ReturnType<typeof mkzCCustomCallReqToProposal>;

  constructor(context: ORContext) {
    this._ctx = context;

    this._zCRespBreakoutReqToProposal = mkzCRespectBreakoutToProposal(this._ctx);
    this._zCRespAccountReqToProposal = mkzCRespAccountReqToProposal(this._ctx);
    this._zCBurnRespReqToProposal = mkzCBurnRespReqToProposal(this._ctx);
    this._zCCustomSignalReqToProposal = mkzCCustomSignalReqToProposal(this._ctx);
    this._zCTickReqToProposal = mkzTickReqToProposal(this._ctx);
    this._zCCustomCallReqToProposal = mkzCCustomCallReqToProposal(this._ctx);
  }

  transformGetProposalsSpec(spec: CGetProposalsSpec): GetProposalsSpec {
    return zCGetProposalsSpecToNodeSpec.parse(spec);
  }

  transformGetAwardsSpec(spec: CGetAwardsSpec): GetAwardsSpec {
    return zCGetAwardsSpecToNodeSpec.parse(spec);
  }

  transformGetVotesSpec(spec: CGetVotesSpec): GetVotesSpec {
    return zCGetVotesSpecToNodeSpec.parse(spec);
  }

  async transformRespectBreakout(req: RespectBreakoutRequest): Promise<RespectBreakout> {
    return await this._zCRespBreakoutReqToProposal.parseAsync(req);
  }

  async transformRespectAccount(req: RespectAccountRequest): Promise<RespectAccount> {
    return await this._zCRespAccountReqToProposal.parseAsync(req);
  }

  async transformBurnRespect(req: BurnRespectRequest): Promise<BurnRespect> {
    return await this._zCBurnRespReqToProposal.parseAsync(req);
  }

  async transformCustomSignal(req: CustomSignalRequest): Promise<CustomSignal> {
    return await this._zCCustomSignalReqToProposal.parseAsync(req);
  }

  async transformTick(req: TickRequest): Promise<TickValid> {
    return await this._zCTickReqToProposal.parseAsync(req);
  }

  async transformCustomCall(req: CustomCallRequest): Promise<CustomCall> {
    return await this._zCCustomCallReqToProposal.parseAsync(req);
  }

  transformVoteType(vt: CVoteType): VoteType {
    return zCVoteTypeToOrec.parse(vt);
  }

}