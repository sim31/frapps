import { RefinementCtx, ZodCustomIssue, z } from "zod";
import { ORContext } from "./orContext.js";
import { Optional } from "utility-types";

// export type CustomIssueData = {
//   message?: string,
//   path?: string | number

// }
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  return { message: `Error parsing value: ${ctx.data}. Error: ${ctx.defaultError}` };
};
z.setErrorMap(customErrorMap);

export type CustomIssueArgs = Optional<Omit<ZodCustomIssue, "code">, "path"> & {
  cause?: any
}

export function addCustomIssue(parsedVal: unknown, ctx: RefinementCtx, cause: unknown, message?: string): void;
export function addCustomIssue(parsedVal: unknown, ctx: RefinementCtx, message: string): void;
export function addCustomIssue(parsedVal: unknown, ctx: RefinementCtx, customData: CustomIssueArgs): void;
export function addCustomIssue(
  parsedVal: unknown,
  ctx: RefinementCtx,
  causeOrCustomOrMsg: unknown,
  message?: string,
) {
  let parsedValue;
  if (typeof parsedVal === 'object'
      && parsedVal !== null
      && 'ctx' in parsedVal
      && typeof parsedVal['ctx'] === 'object'
  ) {
    parsedValue = { ...parsedVal, ctx: undefined };
  } else {
    parsedValue = parsedVal;
  }
  if (typeof causeOrCustomOrMsg === 'object') {
    if (causeOrCustomOrMsg instanceof Error) {
      const issue = {
        code: z.ZodIssueCode.custom,
        params: {
          cause: causeOrCustomOrMsg,
          parsedValue
        },
        message,
        path: ctx.path
      };
      ctx.addIssue(issue);
    } else {
      const customIssue = causeOrCustomOrMsg as CustomIssueArgs;
      const issue = {
        ...causeOrCustomOrMsg,
        code: z.ZodIssueCode.custom,
        message: customIssue.message,
        params: {
          cause: customIssue.cause,
          parsedValue
        },
        path: customIssue.path ?? ctx.path,
        cause: undefined
      };
      ctx.addIssue(issue);

    }
  } else if (typeof causeOrCustomOrMsg === 'string') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ctx.path,
      message: causeOrCustomOrMsg,
      params: {
        parsedValue
      }
    });
  } else {
    throw new Error("Invalid second argument for addCustomIssue");
  }
}