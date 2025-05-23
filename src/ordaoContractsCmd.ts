import { Command } from "commander";
import { readFrapps, readFrappType, readTargetFrappType } from "./readFrapps.js";
import { Frapp } from "./types/frapp.js";
import { zToIgnitionParams } from "./types/transformers/deploymentCfgToIgnition.js";
import fs from "fs"
import { stringify } from "@ordao/ts-utils";
import path from "path";
import { contractsDir, deploymentFile, ignitionCfgPath, ignitionDeployedAddrs, ignitionDir, ignitionModulePath, mkDeploymentsDir } from "./paths.js";
import { exec, execJoinedCommand } from "./exec.js";
import { OrdaoFrapp, zOrdaoFrapp } from "./types/ordaoFrapp.js";
import { NotImplementedError } from "./NotImplementedError.js";
import { OrdaoDeployment } from "./types/ordaoDeployment.js";

// execJoinedCommand('echo "Testing execa" && sleep 3 && echo "Done"');

export const ordaoContractsCmd = new Command("contracts")
  .argument("[targets...]", "frapp ids for which to deploy. \'all\' stands for all frapps which target this app", "all")
  .option("-b, --build", "build contracts")
  .option("-c, --config", "configure (prepare) for deployment")
  .option("-d, --deploy", "deploy")
  .option("--reset", "Clear a previous deployment with a reset. *Only works with -d option!*")
  .option("-v, --verify", "verify")
  .option("-o, --output", "output deployment info (to dist/deployments folder)")
  .option("-a, --all", "shorthand for -cdov")
  .showHelpAfterError()
  .action((targets: string[], opts: any) => {
    console.log("targets: ", targets, ", opts: ", opts);
    /**
     * * Read targets
     * Based on flags:
     * * Generate ignition config;
     * * Deploy with ignition
     * * Output deployment info (contract addresses)
     */

    const config = opts.all || opts.config;
    const deploy = opts.all || opts.deploy;
    const verify = opts.all || opts.verify;
    const output = opts.all || opts.output;
    const build = opts.all  || opts.build;
    const reset = opts.reset;

    const ordaoFrapps = readTargetFrappType(zOrdaoFrapp, targets);

    console.log("frapps: ", ordaoFrapps.map(f => f.id));

    for (const frapp of ordaoFrapps) {
      console.log("frapp: ", frapp);
      if (build) {
        buildContracts(frapp);
      }
      if (config) {
        mkIgnitionCfg(frapp);
      }
      if (deploy) {
        deployIgnition(frapp, reset);
      }
      if (verify) {
        verifyIgnition(frapp);
      }
      if (output) {
        writeDeploymentInfo(frapp);
      }
    }
  });

function mkIgnitionCfg(frapp: OrdaoFrapp) {
  const params = zToIgnitionParams.parse(frapp.deploymentCfg);
  const p = ignitionCfgPath(frapp.id);
  fs.writeFileSync(p, stringify(params));
  console.log("Wrote ignition config: ", p);
}

function deployIgnition(frapp: OrdaoFrapp, reset?: boolean) {
  const params = ignitionCfgPath(frapp.id);
  const modulePath = ignitionModulePath(frapp.deploymentCfg.module);
  const cmd = `
  npx hardhat ignition deploy --network ${frapp.deploymentCfg.network} --deployment-id ${frapp.id} --parameters ${params} ${modulePath} ${reset ? "--reset" : ""}`;
  exec(cmd, { cwd: contractsDir });
}

// Not sure if works yet. Only tested with OrdaoExisting,
// but that's typically not when this is needed.
function verifyIgnition(frapp: OrdaoFrapp) {
  const cmd = `
  npx hardhat ignition verify ${frapp.id}`;
  exec(cmd, { cwd: contractsDir });
}

function readDeploymentFromIgnition(frapp: OrdaoFrapp): OrdaoDeployment {
  const addrsPath = ignitionDeployedAddrs(frapp.id);
  const addrs = JSON.parse(fs.readFileSync(addrsPath, 'utf-8'));
  switch (frapp.deploymentCfg.module) {
    case 'OrdaoExisting': {
      return {
        oldRespect: addrs["OrdaoExisting#ERC20"],
        orec: addrs["OrdaoExisting#Orec"],
        newRespect: addrs["OrdaoExisting#Respect1155"]
      }
    }
    case 'OrdaoNew': {
      return {
        oldRespect: addrs["Orec#ERC20"],
        orec: addrs["Orec#Orec"],
        newRespect: addrs["OrdaoNew#Respect1155"]
      }
    }
    default: {
      const n: never = frapp.deploymentCfg;
      return n;
    }
  }

}

function buildContracts(frapp: OrdaoFrapp) {
  const cmd = `
  npx hardhat compile`;
  exec(cmd, { cwd: contractsDir });
}

function writeDeploymentInfo(frapp: OrdaoFrapp) {
  mkDeploymentsDir();
  const deployment = readDeploymentFromIgnition(frapp);
  const p = deploymentFile(frapp.id);
  fs.writeFileSync(p, stringify(deployment));
  console.log("Wrote deployment info: ", p);
}


