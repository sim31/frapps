import { Command } from "commander";
import { readTargetFrappType } from "./readFrapps.js";
import { OrdaoFrapp, zOrdaoFrapp } from "./types/ordaoFrapp.js";
import { accountsCsvFilePath, rsplitCsvFilePath } from "./ordaoPaths.js";
import fs, { write } from "fs";
import { exec } from "./exec.js";
import { contractsDir, deploymentFile, ignitionCfgPath, ignitionDeployedAddrs, ignitionModulePath, mkDeploymentsDir } from "./paths.js";
import { Account, readAccountsCsv } from "./ordaoAccountsCsv.js";
import { BaseFrapp, zBaseFrapp } from "./types/baseFrapp.js";
import { Required } from "utility-types";
import { NetworkId, zNetworkId } from "./types/baseDeploymentCfg.js";
import { stringify } from "@ordao/ts-utils";
import { symbol } from "zod";
import { EthAddress } from "@ordao/ortypes";

type BaseFrappReq = Required<BaseFrapp, "symbol">; 

export const ordaoParentDeployCmd = new Command("parent-deploy")
  .argument("target", "frapp id for which to deploy")
  .argument("network", "network to deploy to")
  .option("-b, --build", "build contracts")
  .option("-c, --config", "configure (prepare) for deployment")
  .option("-d, --deploy", "deploy")
  .option("-v, --verify", "verify")
  .option("-o, --output", "output deployment info (to dist/deployments folder)")
  .option("-a, --all", "shorthand for -cdov")
  .showHelpAfterError()
  .action(async (target: string, networkId: string, opts: any) => {
    console.log("target: ", target, "network: ", networkId, ", opts: ", opts);

    const config = opts.config;
    const deploy = opts.deploy;
    const verify = opts.verify;
    const output = opts.output;
    const build = opts.build;

    const ordaoFrapps = readTargetFrappType(zOrdaoFrapp, [target]);
    const network = zNetworkId.parse(networkId);

    console.log("frapps: ", ordaoFrapps.map(f => f.id));

    for (const frapp of ordaoFrapps) {
      const { accounts } = await readAccountsCsv(frapp);
      const parentFrapp: BaseFrappReq = readParentFrapp(frapp);
      
      console.log("frapp: ", frapp);
      if (build) {
        buildContracts(frapp);
      }
      if (config) {
        mkIgnitionCfg(frapp, accounts, parentFrapp, network);
      }
      if (deploy) {
        deployIgnition(frapp, network);
      }
      if (verify) {
        verifyIgnition(frapp, network);
      }
      if (output) {
        writeDeploymentInfo(frapp, network);
      }
    }
  });

function ignitionId(frapp: OrdaoFrapp, network: NetworkId) {
  return `${frapp.id}-parent-${network}`;
}

function mkIgnitionCfg(
  frapp: OrdaoFrapp,
  accounts: Account[],
  parentFrapp: BaseFrappReq,
  network: NetworkId
) {
  const params = {
    SolidRespect: {
      name: parentFrapp.fullName,
      symbol: parentFrapp.symbol,
      addresses: accounts.map(a => a.address),
      balances: accounts.map(a => a.balance),
    }
  }
  const p = ignitionCfgPath(frapp.id, `parent-${network}`);
  fs.writeFileSync(p, stringify(params));
  console.log("Wrote ignition config: ", p);
}

function deployIgnition(frapp: OrdaoFrapp, network: NetworkId) {
  const params = ignitionCfgPath(frapp.id, `parent-${network}`);
  const modulePath = ignitionModulePath("SolidRespect");
  const cmd = `
  npx hardhat ignition deploy --network ${network} --deployment-id ${ignitionId(frapp, network)} --parameters ${params} ${modulePath}`;
  exec(cmd, { cwd: contractsDir });
}

// Not sure if works yet. Only tested with OrdaoExisting,
// but that's typically not when this is needed.
function verifyIgnition(frapp: OrdaoFrapp, network: NetworkId) {
  const cmd = `
  npx hardhat ignition verify ${ignitionId(frapp, network)}`;
  exec(cmd, { cwd: contractsDir });
}

function readDeploymentFromIgnition(frapp: OrdaoFrapp, network: NetworkId): EthAddress {
  const addrsPath = ignitionDeployedAddrs(ignitionId(frapp, network));
  const addrs = JSON.parse(fs.readFileSync(addrsPath, 'utf-8'));
  return addrs["SolidRespect#SolidRespect"];
}

function buildContracts(frapp: OrdaoFrapp) {
  const cmd = `
  npx hardhat compile`;
  exec(cmd, { cwd: contractsDir });
}

function writeDeploymentInfo(frapp: OrdaoFrapp, network: NetworkId) {
  mkDeploymentsDir();
  const addr = readDeploymentFromIgnition(frapp, network);
  const p = deploymentFile(frapp.id);

  const depl = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const id = ignitionId(frapp, network);
  depl[id] = addr;

  fs.writeFileSync(p, stringify(depl));
  console.log("Wrote deployment info: ", p);
}

function readParentFrapp(frapp: OrdaoFrapp): BaseFrappReq {
  if (frapp.parentFrappId === undefined) {
    throw new Error("Frapp has no parent frapp");
  }

  const parentFrapp = readTargetFrappType(zBaseFrapp, [frapp.parentFrappId])[0];

  if (parentFrapp.symbol !== undefined) {
    return { ...parentFrapp, symbol: parentFrapp.symbol };
  } else {
    throw new Error("Parent frapp has no symbol");
  }
}
