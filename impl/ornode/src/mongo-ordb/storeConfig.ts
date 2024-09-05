import { z } from "zod";

export const zStoreConfig = z.object({
  defaultDocLimit: z.number().int().gt(0).default(50),
  maxDocLimit: z.number().int().gt(0).default(100)
})
export type StoreConfig = z.infer<typeof zStoreConfig>;