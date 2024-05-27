import { Respect1155__factory } from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import { RespectBreakout, zBreakoutResult, zRespectBreakout } from "./orclient.js";
import { zProposal as zNProposal, zRespectBreakout as zNRespectBreakout, zPropContext, zProposalInContext } from "./ornode.js";
import { EthAddress, MeetingNum, PropType, zMeetingNum, zMintRespectGroupArgs, zPropType, zRankings } from "./common.js";
import { z, RefinementCtx } from "zod";
import { unpackTokenId } from "respect-sc/utils/tokenId.js";
import { expect } from "chai";
import { BigNumberish, ZeroAddress } from "ethers";

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
    addIssue(ctx, `Exception: ${err}`);
  }
}).pipe(zRespectBreakout);

export const zProposalToDecodedProp = zProposalInContext.transform((val, ctx) => {

})