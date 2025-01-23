import { z } from "zod";

export const zNetworkId = z.union([
  z.literal("Optimism"),
  z.literal("Base")
]);

export const zBaseDeployment = z.object({
  module: z.string(),
  network: zNetworkId
});
