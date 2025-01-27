import { Command } from "commander";
import { readFrapps } from "./readFrapps.js";
import { Frapp } from "./types/frapp.js";
import { zToIgnitionParams } from "./types/transformers/deploymentCfgToIgnition.js";
import fs from "fs"
import { stringify } from "@ordao/ts-utils";
import path from "path";
import { contractsDir, ignitionCfgPath, ignitionDir, ignitionModulePath } from "./paths.js";
import { $, execa, execaSync, parseCommandString } from "execa";
import { OrdaoFrapp, zOrdaoFrapp } from "./types/ordaoFrapp.js";

// execJoinedCommand('echo "Testing execa" && sleep 3 && echo "Done"');

export const ordaoContractsCmd = new Command("contracts")
  .argument("[targets...]", "frapp ids for which to deploy. \'all\' stands for all frapps which target this app", "all")
  .option("-c, --config", "configure (prepare) for deployment")
  .option("-d, --deploy", "deploy")
  .option("-v, --verify", "verify")
  .option("-o, --output", "output deployment info")
  .option("-a, --all", "shorthand for -cdov")
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

    const config = opts.all || opts.config;
    const deploy = opts.all || opts.deploy;
    const verify = opts.all || opts.verify;
    const output = opts.all || opts.output;

    const frapps = readFrapps().filter((frapp) => {
      return frapp.app.appId === "ordao" && (targets.includes(frapp.id) || targets.includes('all'));
    });
    // Verify that this is really ordao frapps and type it
    const ordaoFrapps = frapps.map(frapp => {
      const ordaoFrapp = zOrdaoFrapp.safeParse(frapp);
      if (ordaoFrapp.success) {
        return ordaoFrapp.data;
      } else {
        throw new Error(`Frapp ${frapp.id} is not an ordaoFrapp: ${ordaoFrapp.error.message}`)
      }
    })

    console.log("frapps: ", frapps.map(f => f.id));

    for (const frapp of ordaoFrapps) {
      console.log("frapp: ", frapp);
      if (config) {
        mkIgnitionCfg(frapp);
      }
      if (deploy) {
        deployIgnition(frapp);
      }
      if (verify) {
        verifyIgnition();
      }
      if (output) {
        writeDeploymentInfo();
      }
    }
  });

function mkIgnitionCfg(frapp: OrdaoFrapp) {
  const params = zToIgnitionParams.parse(frapp.deploymentCfg);
  const p = ignitionCfgPath(frapp.id);
  fs.writeFileSync(p, stringify(params));
  console.log("Wrote ignition config: ", p);
}

function deployIgnition(frapp: OrdaoFrapp) {
  const params = ignitionCfgPath(frapp.id);
  const modulePath = ignitionModulePath(frapp.deploymentCfg.module);
  const cmd = `
  npx hardhat ignition deploy --network ${frapp.deploymentCfg.network} --deployment-id ${frapp.id} --parameters ${params} ${modulePath}`;
  exec(cmd, contractsDir);
}

function verifyIgnition() {
  throw new Error("Function not implemented.");
}

function writeDeploymentInfo() {

}

function execJoinedCommand(cmd: string, separator = "&&") {
  const cmds = cmd.split(separator);
  cmds.forEach((cmd) => {
    exec(cmd);
  });
}

function exec(cmd: string, cwd?: string) {
  console.log("Executing: ", cmd);
  const cmdArr = parseCommandString(cmd);
  execaSync({ stdio: "inherit", cwd })`${cmdArr}`;
}


