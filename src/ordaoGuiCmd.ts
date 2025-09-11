import { Command } from "commander";
import { readDeployment, readLocalFrappCfg, readTargetFrappType as readTargetFrappType } from "./readFrapps.js";
import { OrdaoFrapp, zOrdaoFrapp } from "./types/ordaoFrapp.js";
import { exec } from "./exec.js";
import { guiBuildCfgDir, guiBuildDir, guiDir, mkGuiBuildDir, mkGuiBuildsDir, ordaoDir, ornodeDir } from "./ordaoPaths.js";
import { zOrdaoLocalCfg } from "./types/ordaoLocalCfg.js";
import { OrdaoFrappFull } from "./types/ordaoFrappDeployed.js";
import { zOrdaoDeployment } from "./types/ordaoDeployment.js";
import { zToOrnodeCfg } from "./types/transformers/ordaoFullToOrnodeCfg.js";
import { mkProcDir, mkSitesDir, procFilepath, siteFile } from "./paths.js";
import { stringify } from "@ordao/ts-utils";
import fs from "fs";
import { createStaticSite } from "./sites.js";
import { readFullCfg } from "./readFullOrdaoCfg.js";
import { frappOrnodeUrl, orclientDocsUrl } from "./ordaoUrls.js";
import { chainInfos } from "./chainInfos.js";

export const ordaoGuiCmd = new Command("gui")
  .argument("[targets...]", "frapp ids for which to apply commands (see options). \'all\' stands for all frapps which target this app", "all")
  .option("-n, --domain <domain>", "domain name", "frapps.xyz")
  .option("-l, --clean", "clean gui builds")
  .option("-c --config", "configure gui builds")
  .option("-b, --build", "build gui")
  .option("-s, --config-site", "configure nginx server blocks to serve gui(s)")
  .option("-a, --all", "shorthand for -lcbs")
  .showHelpAfterError()
  .action((targets: string[], opts) => {
    console.log("targets: ", targets, ", opts: ", opts);

    const clean = opts.all || opts.clean;
    const config = opts.all || opts.config;
    const build = opts.all || opts.build;
    const configSite = opts.all || opts.configSite;
    const domain = opts.domain;

    const frapps = readTargetFrappType(zOrdaoFrapp, targets);

    // Commands for specific frapps
    for (const frapp of frapps) {
      console.log("frapp: ", frapp);

      if (clean) {
        exec(`rm -rf ${guiBuildDir(frapp.id)}`);
      }
      if (config) {
        const fullCfg = readFullCfg(frapp);
        configure(fullCfg, domain);
      }
      if (build) {
        buildGui(frapp);
      }
      if (configSite) {
        configureSite(frapp, domain);
      }
    }
  });


function configureSite(frapp: OrdaoFrapp, domain: string) {
  console.log("Configuring gui site for: ", frapp.id);
  const subdomains = domain === "localhost" ? [""] : frapp.frappsSubdomains;
  createStaticSite(guiBuildDir(frapp.id), domain, subdomains, 'spa');
}

function configure(frapp: OrdaoFrappFull, domain: string) {
  console.log("Configuring gui env");
  const chainInfo = chainInfos[frapp.deploymentCfg.network];
  const https = domain === "localhost" ? false : true;
  // * chain id - can hardcode based on network
  // * rpc urls - based on network
  // * chain name - based on network
  // * block explorer url - based on network
  // * privy app id - that's local
  const env = {
    VITE_OLD_RESPECT_ADDR: frapp.deployment.oldRespect,
    VITE_NEW_RESPECT_ADDR: frapp.deployment.newRespect,
    VITE_OREC_ADDR: frapp.deployment.orec,
    VITE_ORNODE_URL: frapp.deploymentCfg.ornodeOrigin,
    VITE_APP_TITLE: `${frapp.fullName}`,
    VITE_PRIVY_APP_ID: frapp.localOnly.privyAppId,
    VITE_DOCS_ORIGIN: orclientDocsUrl(domain, https),
    VITE_CHAIN_ID: chainInfo.chainId,
    VITE_RPC_URLS: chainInfo.rpcUrls.join(","),
    VITE_CHAIN_NAME: chainInfo.chainName,
    VITE_BLOCKEXP_URL: chainInfo.blockExplorerUrl,
    VITE_PARENT_RESPECT_LINK: frapp.app.parentRespectLink,
    VITE_CHILD_RESPECT_LINK: frapp.app.childRespectLink,
    VITE_RESPECT_GAME_LINK: frapp.app.respectGameLink,
    VITE_DEFAULT_PROP_QUERY_SIZE: frapp.app.defaultPropQuerySize,
    VITE_FRACTAL_DOCS_URL: frapp.app.fractalDocsUrl
  };

  mkGuiBuildsDir();
  const p = guiBuildCfgDir(frapp.id);
  fs.writeFileSync(p, stringify(env));
  console.log("Wrote gui env config: ", p);
}

function buildGui(frapp: OrdaoFrapp) {
  console.log("Building gui");
  const outDir = mkGuiBuildDir(frapp.id);

  const env = readBuildEnv(frapp);

  exec(`npx vite build --outDir ${outDir}`, { cwd: guiDir, env });
}


function readBuildEnv(frapp: OrdaoFrapp) {
  const p = guiBuildCfgDir(frapp.id);
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}


