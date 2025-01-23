import { zBaseFrapp } from "./baseFrapp";
import { zExternalApp } from "./externalApp";

export const zExternalFrapp = zBaseFrapp.extend({
  app: zExternalApp
});