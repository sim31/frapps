import { RefinementCtx, z } from "zod";
import { ORContext } from "../orContext.js";

export function addIssue(ctx: RefinementCtx, message: string) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message
  })
}