import { RefinementCtx, ZodCustomIssue, z } from "zod";
import { ORContext } from "../orContext.js";
import { Optional } from "utility-types";

// export type CustomIssueData = {
//   message?: string,
//   path?: string | number

// }

export type CustomIssueArgs = Optional<Omit<ZodCustomIssue, "code">, "path"> & {
  cause?: any
}

export function addCustomIssue(ctx: RefinementCtx, cause: unknown, message?: string): void;
export function addCustomIssue(ctx: RefinementCtx, message: string): void;
export function addCustomIssue(ctx: RefinementCtx, customData: CustomIssueArgs): void;
export function addCustomIssue(
  ctx: RefinementCtx,
  causeOrCustomOrMsg: unknown,
  message?: string
) {
  if (typeof causeOrCustomOrMsg === 'object') {
    if (causeOrCustomOrMsg instanceof Error) {
      const issue = {
        code: z.ZodIssueCode.custom,
        params: {
          cause: causeOrCustomOrMsg
        },
        message
      };
      ctx.addIssue(issue);
    } else {
      const customIssue = causeOrCustomOrMsg as CustomIssueArgs;
      const issue = {
        ...causeOrCustomOrMsg,
        code: z.ZodIssueCode.custom,
        message: customIssue.message,
        params: {
          cause: customIssue.cause
        },
        cause: undefined
      };
      ctx.addIssue(issue);

    }
  } else if (typeof causeOrCustomOrMsg === 'string') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: causeOrCustomOrMsg
    });
  } else {
    throw new Error("Invalid second argument for addCustomIssue");
  }
}