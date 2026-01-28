import { Command } from "commander";
import { readDeployment, readLocalFrappCfg, readTargetFrappType } from "./readFrapps.js";
import { zOrdaoApp } from "./types/ordaoApp.js";
import { OrdaoFrapp, zOrdaoFrapp } from "./types/ordaoFrapp.js";
import { exec } from "./exec.js";
import { ordaoDir, ornodeDir, ornodeExportDir, ornodeIndexFile } from "./ordaoPaths.js";
import { zOrdaoLocalCfg } from "./types/ordaoLocalCfg.js";
import { OrdaoFrappFull } from "./types/ordaoFrappDeployed.js";
import { zOrdaoDeployment } from "./types/ordaoDeployment.js";
import { zToOrnodeCfg } from "./types/transformers/ordaoFullToOrnodeCfg.js";
import { mkDir, mkProcDir, mkSitesDir, procFilepath, siteFile } from "./paths.js";
import { stringify } from "@ordao/ts-utils";
import { endent } from "./endent.js";
import fs from "fs";
import { createProxySite } from "./sites.js";
import { readFullCfg } from "./readFullOrdaoCfg.js";
import { frappOrnodeSiteName } from "./ordaoUrls.js";
import { cwd } from "process";
import { StartOptions } from "pm2"
import { MongoClient, WithId } from "mongodb";
import path from "path";
import { zFungibleTokenId, zFungibleTokenIdNoPrefix, zRespectAwardMt } from "@ordao/ortypes/respect1155.js";
import { zStoredProposal } from "@ordao/ortypes/ornode.js";
import { zVote } from "@ordao/ortypes/ornode.js";

export const ordaoOrnodeCmd = new Command("ornode")
  .argument("[targets...]", "frapp ids for which to apply commands (see options). \'all\' stands for all frapps which target this app", "all")
  .option("-n, --domain <domain>", "domain name", "frapps.xyz")
  .option("-l, --clean", "clean ornode build")
  .option("-b, --build", "build ornode")
  .option("-c, --config", "configure ornode instances")
  .option("-s, --config-sites", "configure nginx server blocks to serve ornode(s)")
  .option("-p, --config-process", "create pm2 start options for ornode instances")
  .option("-d, --db-backup", "backup ornode db")
  .option("-e, --export [img-dir-url]", "export ornode db")
  .option("-a, --all", "shorthand for -lbcsp")
  .showHelpAfterError()
  .action(async (targets: string[], opts) => {
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
    const exprt = opts.export;
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

      if (exprt) {
        console.log("Exporting ornode db");
        const imgDirUrl = typeof opts.export === 'string' ? opts.export : undefined;
        console.log("imgDirUrl: ", imgDirUrl);
        if (fullCfg === undefined) {
          fullCfg = readFullCfg(frapp);
        }
        exportDb(fullCfg, imgDirUrl);
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
  const ornodeOrigin = frapp.deploymentCfg.ornodeOrigin;
  if (ornodeOrigin !== undefined) {
    const url = new URL(ornodeOrigin);
    const hostname = url.hostname;
    // Remove top-level domain to get subdomain
    const parts = hostname.split('.');
    const subdomain = parts.length > 1 ? parts.slice(0, -1).join('.') : parts[0];
    if (!siteNames.includes(subdomain)) {
      throw new Error(`Ornode origin specified and its subdomain ${subdomain} not in frapp subdomains`);      
    }
  }
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
  console.log("Start: ", `npx pm2 start ${p}`);
}

function backup() {
  const backupDir = process.env.BACKUP_DIR;
  const uri = process.env.MONGO_DUMP_URI;

  const outFile = `${backupDir}/${Date.now()}.bson`

  const cmd = `mongodump --archive=${outFile} ${uri}`

  exec(cmd)
}

interface ParseRes {
  filename: string;
  doc: unknown;
}

function exportDocs(
  dir: string,
  docs: unknown[],
  parse: (doc: unknown) => ParseRes,
) {
  mkDir(dir);

  for (const doc of docs) {
    const pr = parse(doc);
    const p = path.join(dir, pr.filename);
    fs.writeFileSync(p, stringify(pr.doc));
  }
}

async function exportDb(frapp: OrdaoFrappFull, imgDirUrl?: string) {
  const uri = frapp.localOnly.mongoCfg.url;
  const dbName = frapp.localOnly.mongoCfg.dbName;
  const mgClient = new MongoClient(uri);
  const db = mgClient.db(dbName);

  const getImgUrl = (imgFilename: string) => {
    if (imgDirUrl) {
      return path.join(imgDirUrl, imgFilename);
    } else {
      return undefined;
    }
  }

  const awardsCollection = db.collection('awards');
  const awards = await awardsCollection.find({}, {projection: {_id: 0}}).toArray();
  console.log("Award count: ", awards.length);
  const dir = path.join(ornodeExportDir(frapp.id), "tokens");
  exportDocs(
    dir,
    awards,
    doc => {
      const award = zRespectAwardMt.parse(doc);
      const filename = `${award.properties.tokenId.substring(2)}.json`
      const imgUrl = getImgUrl("award.image.png");
      if (imgUrl !== undefined) {
        award.image = imgUrl;
      }
      return { filename, doc: award };
    }
  );
  const fungible = frapp.app.respect.fungible;
  const fungiblePath = path.join(dir, `${zFungibleTokenId.value.substring(2)}.json`);
  console.log("Respect fungible token: ", fungible);
  const imgUrl = getImgUrl("fungible.image.png");
  if (imgUrl !== undefined) {
    fungible.image = imgUrl;
  }
  fs.writeFileSync(fungiblePath, stringify(fungible));
  console.log("Wrote fungible token: ", fungiblePath);

  const proposalsCollection = db.collection('proposals');
  const proposals = await proposalsCollection.find({}, {projection: {_id: 0}}).toArray();
  console.log("Proposal count: ", proposals.length);
  const dir2 = path.join(ornodeExportDir(frapp.id), "proposals");
  exportDocs(
    dir2,
    proposals,
    doc => {
      const proposal = zStoredProposal.parse(doc);
      return {
        filename: `${proposal.id}.json`,
        doc: proposal
      }
    }
  );

  const votesCollection = db.collection('votes');
  const votes = await votesCollection.find({}, {projection: {_id: 0}}).toArray();
  console.log("Vote count: ", votes.length);
  const dir3 = path.join(ornodeExportDir(frapp.id), "votes");
  exportDocs(
    dir3,
    votes,
    doc => {
      const vote = zVote.parse(doc);
      return {
        filename: `${vote.txHash}.json`,
        doc: vote
      }
    }
  );

  const contract = frapp.app.respect.contract;
  console.log("Respect contract metadata: ", contract); 
  const p = path.join(ornodeExportDir(frapp.id), `respectContractMt.json`);
  const cImgUrl = getImgUrl("contract.image.png");
  if (cImgUrl !== undefined) {
    contract.image = cImgUrl;
  }
  const cBannerImgUrl = getImgUrl("contract.banner_image.png");
  if (cBannerImgUrl !== undefined) {
    contract.banner_image = cBannerImgUrl;
  }
  const cFeaturedImgUrl = getImgUrl("contract.featured_image.png");
  if (cFeaturedImgUrl !== undefined) {
    contract.featured_image = cFeaturedImgUrl;
  }
  fs.writeFileSync(p, stringify(contract));
  console.log("Wrote contract metadata: ", p);


  mgClient.close();
}

