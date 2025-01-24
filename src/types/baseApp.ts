import { z } from "zod";

export const zBaseApp = z.object({
  appId: z.string()
});
export type BaseApp = z.infer<typeof zBaseApp>;