import { z } from "zod";
import { zBaseApp } from "./baseApp";
import { zBaseDeployment } from "./baseDeployment";

export const zBaseFrapp = z.object({
  id: z.string().describe("Short identifier for the fractal."),
  fullName: z.string().describe("Full name / title of this fractal."),
  description: z.string().optional(),
  deployment: zBaseDeployment.optional(),
  app: zBaseApp,
});
export type BaseFrapp = z.infer<typeof zBaseFrapp>;