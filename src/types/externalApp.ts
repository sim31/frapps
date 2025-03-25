import { z } from "zod";
import { zBaseApp } from "./baseApp.js";

export const zExternalApp = zBaseApp.extend({
  appId: z.literal("externalApp"),
  url: z.string().url()
});