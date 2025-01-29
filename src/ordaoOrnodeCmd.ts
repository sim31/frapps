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
import { mkProcDir, mkSitesDir, procFilename, siteFile } from "./paths.js";
import { stringify } from "@ordao/ts-utils";
import { endent } from "./endent.js";
import fs from "fs";

export const ordaoOrnodeCmd = new Command("ornode")
  .argument("[targets...]", "frapp ids for which to apply commands (see options). \'all\' stands for all frapps which target this app", "all")
  .option("-n, --domain <domain>", "domain name", "frapps.xyz")
  .option("-l, --clean", "clean ornode build")
  .option("-b, --build", "build ornode")
  .option("-c --config", "configure ornode instances")
  .option("-r, --run", "run ornode instances")
  .option("-a, --all", "shorthand for -lbcr")
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
    const domain = opts.domain;

    const frapps = readTargetFrappType(zOrdaoFrapp, targets);

    // Commands for all frapps
    if (clean) {
      console.log("Cleaning ornode build");
      exec("npm run clean", ornodeDir);
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
        configureOrnode(frapp, domain);
      }
      if (run) {
        console.log("Running ornode for ", frapp.id);
      }
    }
  });

function configureOrnode(frapp: OrdaoFrapp, domain: string) {
  console.log("Configuring ornode for ", frapp.id);

  const fullCfg = readFullCfg(frapp);

  createOrnodeCfg(fullCfg);
  createNginxBlock(fullCfg, domain);  
}

function readFullCfg(frapp: OrdaoFrapp) {
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

function createOrnodeCfg(frapp: OrdaoFrappFull) {
  const ornodeCfg = zToOrnodeCfg.parse(frapp);
  const p = procFilename(frapp.id, "ornode");
  fs.writeFileSync(p, stringify(ornodeCfg));
  console.log("Wrote ornode config: ", p);
}

function createNginxBlock(frapp: OrdaoFrappFull, domain: string) {
  const s = endent`
  server {
    listen 443 ssl;
    server_name ${frapp.id}-ornode.${domain};

    location / {
      proxy_pass http://localhost:${frapp.localOnly.ornode.port};
    }
  }
  `
  mkSitesDir();

  const p = siteFile("ornode", frapp.id);
  fs.writeFileSync(p, s);
  console.log("Wrote nginx server block for ornode: ", p);
}





