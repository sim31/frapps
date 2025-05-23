import { z } from "zod";

export const zNetworkId = z.union([
  z.literal("optimism"),
  z.literal("opSepolia"),
  z.literal("base"),
  z.literal("baseSepolia")
]);
export type NetworkId = z.infer<typeof zNetworkId>;

export const zBaseDeploymentCfg = z.object({
  module: z.string(),
  network: zNetworkId
});
