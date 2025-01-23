import { z } from "zod";
import { zBaseFrapp } from "./baseFrapp";
import { zOrdaoDeployment } from "./ordaoDeployment";
import { zOrdaoApp } from "./ordaoApp";

export const zOrdaoFrapp = zBaseFrapp.extend({
  deployment: zOrdaoDeployment,
  app: zOrdaoApp
});
export type OrdaoFrapp = z.infer<typeof zOrdaoFrapp>;
