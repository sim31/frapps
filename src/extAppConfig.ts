import { Command } from "commander";
import { createRedirectSite } from "./sites.js";
import { zExternalFrapp, ExternalFrapp } from "./types/externalFrapp.js";
import { readTargetFrappType } from "./readFrapps.js";

export const extAppConfigCmd = new Command("config")
  .argument("[targets...]", "frapp ids for which to apply commands (see options). \'all\' stands for all frapps which target this app", "all")
  .option("-n, --domain <domain>", "domain name", "frapps.xyz")
  .showHelpAfterError()
  .action((targets: string[], opts) => {
    console.log("targets: ", targets, ", opts: ", opts);

    const domain = opts.domain;

    const frapps = readTargetFrappType(zExternalFrapp, targets);

    for (const frapp of frapps) {
      configureSite(frapp, domain);
    }
  });

function configureSite(frapp: ExternalFrapp, domain: string) {
  console.log("Configuring site for: ", frapp.id);
  const siteNames = frapp.frappsSubdomains ?? [frapp.id];
  createRedirectSite(frapp.app.url, domain, siteNames);
}
