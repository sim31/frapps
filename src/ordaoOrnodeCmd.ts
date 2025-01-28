import { Command } from "commander";
import { readDeployment, readLocalFrappCfg, readTargetFrappTypes as readTargetFrappType } from "./readFrapps.js";
import { zOrdaoApp } from "./types/ordaoApp.js";
import { OrdaoFrapp, zOrdaoFrapp } from "./types/ordaoFrapp.js";
import { exec } from "./exec.js";
import { ordaoDir, ornodeDir } from "./ordaoPaths.js";
import { zOrdaoLocalCfg } from "./types/ordaoLocalCfg.js";
import { OrdaoFrappFull } from "./types/ordaoFrappDeployed.js";
import { zOrdaoDeployment } from "./types/ordaoDeployment.js";
import { zToOrnodeCfg } from "./types/transformers/ordaoFullToOrnodeCfg.js";
import { mkProcDir, procFilename } from "./paths.js";
import { stringify } from "@ordao/ts-utils";
import fs from "fs";

export const ordaoOrnodeCmd = new Command("ornode")
  .argument("[targets...]", "frapp ids for which to deploy. \'all\' stands for all frapps which target this app", "all")
  .option("-l, --clean", "clean ornode build")
  .option("-b, --build", "build ornode")
  .option("-c --config", "configure ornode instances")
  .option("-r, --run", "run ornode instances")
  .option("-a, --all", "shorthand for -bcr")
  .showHelpAfterError()
  .action((targets: string[], opts) => {
    console.log("targets: ", targets, ", opts: ", opts);
    /**
     * * Read targets
     * Based on flags:
     * * Generate ignition config;
     * * Deploy with ignition
     * * Output deployment info (contract addresses)
     */

    const clean = opts.all || opts.clean;
    const build = opts.all || opts.build;
    const config = opts.all || opts.config;
    const run = opts.all || opts.run;

    const frapps = readTargetFrappType(zOrdaoFrapp, targets);

    // Commands for all frapps
    if (clean) {
      console.log("Cleaning ornode build");
      exec("npm run clean", ordaoDir);
    }
    if (build) {
      console.log("Building ornode");
      exec("npm run build", ordaoDir);
    }

    // Commands for specific frapps
    for (const frapp of frapps) {
      console.log("frapp: ", frapp);

      mkProcDir(frapp.id);

      if (config) {
        configureOrnode(frapp);
      }
      if (run) {
        console.log("Running ornode for ", frapp.id);
      }
    }
  });

function configureOrnode(frapp: OrdaoFrapp) {
  console.log("Configuring ornode for ", frapp.id);

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

  const ornodeCfg = zToOrnodeCfg.parse(fullCfg);
  const p = procFilename(frapp.id, "ornode");
  fs.writeFileSync(p, stringify(ornodeCfg));
  console.log("Wrote ornode config: ", p);
}



