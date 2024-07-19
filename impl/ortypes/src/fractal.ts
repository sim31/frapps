import { z } from "zod";
import { addCustomIssue } from "./zErrorHandling.js";
import { zMintRespectGroupArgs } from "./respect1155.js";
import { zEthAddress } from "./eth.js";

export { zGroupNum, GroupNum, zRankNum } from "./respect1155.js";

export const PropTypeValues = [
  "respectBreakout", "respectAccount", "burnRespect", "tick",
  "customSignal", "customCall"
] as const;
export const zPropType = z.enum(PropTypeValues);
export type PropType = z.infer<typeof zPropType>;

export const zRankings = z.array(zEthAddress).min(3).max(6);
export type Rankings = z.infer<typeof zRankings>;

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
      addCustomIssue(val, ctx, "value is not equal to any of possible breakout group rewards");
      return NaN;
    }
  }
});

export const zBreakoutMintRequest = zMintRespectGroupArgs.superRefine((val, ctx) => {
  try {
    for (const [i, req] of val.mintRequests.entries()) {
      const rankFromVal = zValueToRanking.parse(req.value);
      z.literal(rankFromVal).parse(6-i);
    }
  } catch (err) {
    addCustomIssue(val, ctx, err, "Error parsing zBreakoutMintRequest");
  }
});
