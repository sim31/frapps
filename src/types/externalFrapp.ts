import { z } from "zod";
import { zBaseFrapp } from "./baseFrapp.js";
import { zExternalApp } from "./externalApp.js";

const zSubdomain = z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?$/);

export const zExternalFrapp = zBaseFrapp.extend({
  frappsSubdomains: z.array(zSubdomain).optional(),
  app: zExternalApp,
});
export type ExternalFrapp = z.infer<typeof zExternalFrapp>;
