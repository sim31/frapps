import { z } from "zod";
import { zBaseApp } from "./baseApp.js";
import { zBaseDeploymentCfg } from "./baseDeploymentCfg.js";

export const zBaseFrapp = z.object({
  id: z.string().regex(/^[a-z-]{2,12}$/).describe("Short identifier for the fractal. Must be unique."),
  fullName: z.string().describe("Full name / title of this fractal."),
  description: z.string().optional(),
  deploymentCfg: zBaseDeploymentCfg.optional(),
  app: zBaseApp,
});
export type BaseFrapp = z.infer<typeof zBaseFrapp>;