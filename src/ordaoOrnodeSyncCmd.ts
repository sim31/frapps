import { Command } from "commander";
import { readTargetFrappType } from "./readFrapps.js";
import { zOrdaoFrapp } from "./types/ordaoFrapp.js";
import { procFilepath } from "./paths.js";
import { Config as OrnodeCfg, zConfig as zOrnodeCfg } from "@ordao/ornode/dist/config.js";
import fs from "fs";
import { stringify } from "@ordao/ts-utils";
import { exec } from "./exec.js";
import { ornodeDir, ornodeIndexFile } from "./ordaoPaths.js";
import { StartOptions } from "pm2";

export const ordaoOrnodeSyncCmd = new Command("ornode-sync")
  .argument("<from-block>", "from block")
  .argument("<to-block>", "to block")
  .argument("[targets...]", "frapp ids for which to sync ornodes. \'all\' stands for all frapps", "all")
  .option("-s, --step-range <step-range>", "size of sync steps (for querying eth node)", "8000")
  .showHelpAfterError()
  .description("Queries for relevant blockchain events in specified block range. Use in case some blockchain events were missed. Depends on ornode configs for each frapp having been generated.")
  .action((fromBlock, toBlock, targets: string[], opts: any) => {

    const fromBlockNum: number = Number.parseInt(fromBlock);
    const toBlockNum: number = Number.parseInt(toBlock);
    const stepRange: number = Number.parseInt(opts.stepRange);

    console.log("options: ", opts);

    const frapps = readTargetFrappType(zOrdaoFrapp, targets);

    for (const frapp of frapps) {
      console.log("frapp: ", frapp);

      // Read main ornode config
      const p = procFilepath(frapp.id, "ornode");
      const data = fs.readFileSync(p, 'utf8');
      const jsonData = JSON.parse(data);
      console.log("JSON Data: ", jsonData);
      const cfg: OrnodeCfg = zOrnodeCfg.parse(jsonData);

      // Change it to sync
      cfg.ornode.sync = {
        fromBlock: fromBlockNum,
        toBlock: toBlockNum,
        stepRange
      }
      cfg.ornode.port = 9999;

      // Write it
      const sp = procFilepath(frapp.id, `ornode-sync`)
      fs.writeFileSync(sp, stringify(cfg));

      console.log("Wrote config for syncing to: ", sp);

      // Create pm2 config for it
      const env = {
        ORNODE_CFG_PATH: sp
      }

      exec(`node ${ornodeIndexFile}`, { cwd: ornodeDir, env });
    }

    
  })

