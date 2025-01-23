import { z } from "zod";

export const zBaseApp = z.object({
  app: z.string()
});
export type BaseApp = z.infer<typeof zBaseApp>;