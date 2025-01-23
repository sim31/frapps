import { z } from "zod";
import { zBaseApp } from "./baseApp";

export const zExternalApp = zBaseApp.extend({
  app: z.literal("external"),
  url: z.string().url()
});