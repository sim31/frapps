import { Command } from "commander";
import { readTargetFrappType } from "./readFrapps.js";
import { OrdaoFrapp, zOrdaoFrapp } from "./types/ordaoFrapp.js";
import { rsplitCsvFilePath } from "./ordaoPaths.js";
import { readAccountsCsv } from "./ordaoAccountsCsv.js";
import fs, { write } from "fs";
import { stringify } from 'csv-stringify';
import { pipeline } from 'stream/promises';

export const ordaoRSplitsCmd = new Command("rsplits")
  .argument("[targets...]", "frapp ids for which to deploy. \'all\' stands for all frapps which target this app", "all")
  .option("-c, --output-csv", "create csv file with percentages to create splits from")
  .option("-a, --all", "shorthand for -c")
  .addHelpText("before", "Create splits contracts based on Respect distributions.")
  .showHelpAfterError()
  .action(async (targets: string[], opts: any) => {
    console.log("targets: ", targets, ", opts: ", opts);
    /**
     * * Read targets
     * Based on flags:
     * * Generate ignition config;
     * * Deploy with ignition
     * * Output deployment info (contract addresses)
     */

    const outputCsv = opts.all || opts.outputCsv;

    const ordaoFrapps = readTargetFrappType(zOrdaoFrapp, targets);

    console.log("frapps: ", ordaoFrapps.map(f => f.id));

    for (const frapp of ordaoFrapps) {
      console.log("frapp: ", frapp);

      if (outputCsv) {
        const { accounts, totalRespect } = await readAccountsCsv(frapp);
        console.log("Total Respect: ", totalRespect);

        const records = accounts.map(a => {
          return {
            address: a.address,
            percent: ((a.balance / totalRespect) * 100).toFixed(4)
          }
        });
        const p = rsplitCsvFilePath(frapp.id);
        const writeStream = fs.createWriteStream(p);

        await pipeline(records, stringify({ header: false }), writeStream);

        console.log("Wrote csv file: ", p);
      }
    }
  });

