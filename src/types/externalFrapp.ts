import { zBaseFrapp } from "./baseFrapp.js";
import { zExternalApp } from "./externalApp.js";

export const zExternalFrapp = zBaseFrapp.extend({
  app: zExternalApp
});