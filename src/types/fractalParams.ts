import { zEthAddress } from "@ordao/ortypes";
import { z } from "zod";

export const zFractalParams = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  symbol: z.string().optional(),
  address: zEthAddress  
})