import { Respect1155__factory } from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import {
  RespectBreakout,
  zBreakoutResult,
  zDecodedProposal,
  zRespectBreakout,
  zRespectAccount,
  Proposal
} from "./orclientTypes.js";
import {
  zProposal as zNProposal,
  zRespectBreakout as zNRespectBreakout,
  zRespectAccount as zNRespectAccount,
  Proposal as NProposal
} from "./ornodeTypes.js";
import {
  EthAddress,
  MeetingNum,
  PropType,
  zEthAddress,
  zMeetingNum,
  zMintRespectArgs,
  zMintRespectGroupArgs,
  zPropType,
  zRankings
} from "./common.js";
import { z, RefinementCtx } from "zod";
import { unpackTokenId } from "respect-sc/utils/tokenId.js";
import { expect } from "chai";
import { BigNumberish, ZeroAddress } from "ethers";
import { Provider } from "ethers";
import { Orec } from "orec/typechain-types/index.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { FractalRespect } from "op-fractal-sc/typechain-types/contracts/FractalRespect.js";
import { ORContext } from "./orContext.js";

export const zNPropContext = z.instanceof(ORContext);
export type NPropContext = z.infer<typeof zNPropContext>;

export const zNProposalInContext = z.object({
  ctx: zNPropContext,
  prop: zNProposal
});
export type NProposalInContext = z.infer<typeof zNProposalInContext>;

export interface Config {
  provider: Provider,
  orec: Orec | EthAddress,
  newRespect: Respect1155 | EthAddress
}



const respectInterface = Respect1155__factory.createInterface();

function addIssue(ctx: RefinementCtx, message: string) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message
  })
}

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
      if (meetingNum === undefined) {
        meetingNum = zMeetingNum.parse(tokenIdData.periodNumber);
      } else {
        expect(tokenIdData.periodNumber).to.be.equal(meetingNum);
      }
      rankings.push(tokenIdData.owner);
    }
    
    if (meetingNum !== undefined) {
      const r: RespectBreakout = {
        propType: zPropType.Enum.respectBreakout,
        meetingNum: meetingNum,
        rankings,
        groupNum: 0
      };
      return r;
    }
  } catch (err) {
    addIssue(ctx, `Error: ${err}`);
  }
}).pipe(zRespectBreakout);

export const zProposalToRespectBreakout = zProposalInContext.transform((val, ctx) => {
  try {
    const nRespectBreakout = zNRespectBreakout.parse(val);

    expect(val.prop.content.address).to.be.equal(
      val.newRespectAddr,
      "respect breakout message expected to be addressed to newRespectAddr"
    );

    const tx = respectInterface.parseTransaction({ data: val.prop.content.cdata });
    expect(tx?.name).to.be.equal(
      respectInterface.getFunction('mintRespectGroup').name,
      "expected mintRespectGroup function to be called"
    );
    const args = zMintRespectGroupArgs.parse(tx?.args);
    const respectBreakout = zMintArgsToRespectBreakout.parse(args);
    respectBreakout.groupNum = nRespectBreakout.attachment.groupNum;

    return respectBreakout;
  } catch(err) {
    addIssue(ctx, `Exception in zProposalToRespectBreakout: ${err}`);
  }
}).pipe(zRespectBreakout);

export const zProposalToRespectAccount = zProposalInContext.transform((val, ctx) => {
  try{
    const nRespectBreakout = zNRespectAccount.parse(val);

    expect(val.prop.content.address).to.be.equal(
      val.newRespectAddr,
      "respect breakout message expected to be addressed to newRespectAddr"
    );

    const tx = respectInterface.parseTransaction({ data: val.prop.content.cdata });
    expect(tx?.name).to.be.equal(
      respectInterface.getFunction('mintRespect').name,
      "expected mintRespect function to be called"
    );

    const args = zMintRespectArgs.parse(tx?.args);
  } catch(err) {
    addIssue(ctx, `Exception in zProposalToRespectAccount: ${err}`)
  }
}).pipe(zRespectAccount);

export const zProposalToDecodedProp = zProposalInContext.transform((val, ctx) => {
  switch (val.prop.attachment.propType) {
    case 'respectBreakout':
      return zProposalToRespectBreakout.parse(val);
    case 'respectAccount':

  }
}).pipe(zDecodedProposal);

export const zProposalToClientProp = zNProposalInContext.transform((val, ctx) => {

})


export class NodeToClientTransformer {
  private _ctx: NPropContext;

  constructor(context: NPropContext) {
    this._ctx = context;
  }

  toContext(prop: NProposal): NProposalInContext {
    return {
      ctx: this._ctx,
      prop
    };
  }
}