import { zEthAddress } from "@ordao/ortypes";
import { z } from "zod";

export const zRespectHolders = z.array(
  z.object({
    address: zEthAddress,
    amount: z.number().int().gt(0)
  }
));
export type RespectHolders = z.infer<typeof zRespectHolders>;
