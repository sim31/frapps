import { readDeployment, readLocalFrappCfg } from "./readFrapps.js";
import { zOrdaoDeployment } from "./types/ordaoDeployment.js";
import { OrdaoFrapp } from "./types/ordaoFrapp.js";
import { OrdaoFrappFull } from "./types/ordaoFrappDeployed.js";
import { zOrdaoLocalCfg } from "./types/ordaoLocalCfg.js";

export function readFullCfg(frapp: OrdaoFrapp) {
  const localCfg = readLocalFrappCfg(frapp.id, zOrdaoLocalCfg);
  if (localCfg === undefined) {
    throw new Error("Could not find local config for " + frapp.id);
  }
  const deployment = readDeployment(frapp.id, zOrdaoDeployment);
  if (deployment === undefined) {
    throw new Error("Could not find deployment file for " + frapp.id);
  }
  const fullCfg: OrdaoFrappFull = {
    ...frapp,
    localOnly: localCfg,
    deployment
  }
  return fullCfg;
}
