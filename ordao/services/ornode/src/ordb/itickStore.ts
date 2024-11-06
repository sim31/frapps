import { zTxHash } from "ortypes";
import { z } from "zod";

export const zTickEvent = z.object({
  txHash: zTxHash.optional().describe("Hash of transaction which executed the tick")
})
export type TickEvent = z.infer<typeof zTickEvent>;

export interface ITickStore {
  tickCount: () => Promise<number>;
  createTick: (tickEv: TickEvent) => Promise<void>;
}