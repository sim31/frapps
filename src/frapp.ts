import { z } from "zod";
import { zOrdaoFrapp } from "./ordaoFrapp";
import { zExternalApp } from "./externalApp";

export const zFrapp = z.union([
  zOrdaoFrapp,
  zExternalApp
]);
export type Frapp = z.infer<typeof zFrapp>;


