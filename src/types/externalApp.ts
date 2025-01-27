import { z } from "zod";
import { zBaseFrapp } from "./baseFrapp.js";

export const zExternalApp = zBaseFrapp.extend({
  app: z.object({
    appId: z.literal("externalApp")
  }),
  url: z.string().url()
});