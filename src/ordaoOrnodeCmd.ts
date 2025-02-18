import { Command } from "commander";
import { readDeployment, readLocalFrappCfg, readTargetFrappType } from "./readFrapps.js";
import { zOrdaoApp } from "./types/ordaoApp.js";
import { OrdaoFrapp, zOrdaoFrapp } from "./types/ordaoFrapp.js";
import { exec } from "./exec.js";
import { ordaoDir, ornodeDir, ornodeIndexFile } from "./ordaoPaths.js";
import { zOrdaoLocalCfg } from "./types/ordaoLocalCfg.js";
import { OrdaoFrappFull } from "./types/ordaoFrappDeployed.js";
import { zOrdaoDeployment } from "./types/ordaoDeployment.js";
import { zToOrnodeCfg } from "./types/transformers/ordaoFullToOrnodeCfg.js";
import { mkProcDir, mkSitesDir, procFilepath, siteFile } from "./paths.js";
import { stringify } from "@ordao/ts-utils";
import { endent } from "./endent.js";
import fs from "fs";
import { createProxySite } from "./sites.js";
import { readFullCfg } from "./readFullOrdaoCfg.js";
import { frappOrnodeSiteName } from "./ordaoUrls.js";
import { cwd } from "process";
import { StartOptions } from "pm2"

export const ordaoOrnodeCmd = new Command("ornode")
  .argument("[targets...]", "frapp ids for which to apply commands (see options). \'all\' stands for all frapps which target this app", "all")
  .option("-n, --domain <domain>", "domain name", "frapps.xyz")
  .option("-l, --clean", "clean ornode build")
  .option("-b, --build", "build ornode")
  .option("-c, --config", "configure ornode instances")
  .option("-s, --config-sites", "configure nginx server blocks to serve ornode(s)")
  .option("-p, --config-process", "create pm2 start options for ornode instances")
  .option("-d, --db-backup", "backup ornode db")
  .option("-a, --all", "shorthand for -lbcp")
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
    const configSites = opts.all || opts.configSites;
    const configProc = opts.all || opts.configProcess;
    const dbBackup = opts.dbBackup;
    const domain = opts.domain;

    const frapps = readTargetFrappType(zOrdaoFrapp, targets);

    // Commands for all frapps
    if (clean) {
      console.log("Cleaning ornode build");
      exec("npm run clean", { cwd: ornodeDir });
    }
    if (build) {
      console.log("Building ornode");
      exec("npm run build", { cwd: ordaoDir });
    }
    if (dbBackup) {
      console.log("Backing up ornode db");
      backup();
    }

    // Commands for specific frapps
    for (const frapp of frapps) {
      console.log("frapp: ", frapp);

      mkProcDir(frapp.id);

      let fullCfg: OrdaoFrappFull | undefined;

      if (config) {
        fullCfg = readFullCfg(frapp);
        configureOrnode(fullCfg, domain);
      }
      if (configSites) {
        if (fullCfg === undefined) {
          fullCfg = readFullCfg(frapp);
        }
        createOrnodeSite(fullCfg, domain);
      }
      if (configProc) {
        createProcCfg(frapp);
      }
    }
  });

function configureOrnode(frapp: OrdaoFrappFull, domain: string) {
  console.log("Configuring ornode for ", frapp.id);

  createOrnodeCfg(frapp);
}

function createOrnodeCfg(frapp: OrdaoFrappFull) {
  const ornodeCfg = zToOrnodeCfg.parse(frapp);
  const p = procFilepath(frapp.id, "ornode");
  fs.writeFileSync(p, stringify(ornodeCfg));
  console.log("Wrote ornode config: ", p);
}

function createOrnodeSite(frapp: OrdaoFrappFull, domain: string) {
  console.log("Creating ornode site: ", frapp.id);
  const procAddr = `http://localhost:${frapp.localOnly.ornode.port}`;
  const siteNames = frapp.frappsSubdomains.map(d => frappOrnodeSiteName(d));
  createProxySite(procAddr, domain, siteNames);
}

function createProcCfg(frapp: OrdaoFrapp) {
  const env = {
    ORNODE_CFG_PATH: procFilepath(frapp.id, "ornode"),
  }
  const procName = `${frapp.id}-ornode`;

  const pm2Opts: StartOptions = {
    name: procName,
    script: ornodeIndexFile,
    cwd: ornodeDir,
    env,
    time: true
  };

  const p = procFilepath(frapp.id, "ornode.pm2");

  fs.writeFileSync(p, stringify(pm2Opts));
  console.log("Wrote pm2 config: ", p);
  console.log("Start: ", `pm2 start ${p}`);
}

function backup() {
  const backupDir = process.env.BACKUP_DIR;
  const uri = process.env.MONGO_DUMP_URI;

  const outFile = `${backupDir}/${Date.now()}.bson`

  const cmd = `mongodump --archive=${outFile} ${uri}`

  exec(cmd)
}

