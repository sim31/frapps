import { Command } from "commander";
import { exec } from "./exec.js";
import { orclientDocsBuildDir, orclientDocsDir, ordaoDir, ornodeDir } from "./ordaoPaths.js";
import { endent } from "./endent.js";
import { mkSitesDir, siteFile } from "./paths.js";
import fs from "fs";

export const ordaoOrclientDocsCmd = new Command("orclient-docs")
  .option("-n, --domain <domain>", "domain name", "frapps.xyz")
  .option("-l, --clean", "clean build")
  .option("-b, --build", "build ornode")
  .option("-c --config", "configure nginx server blocks to serve this app")
  .option("-a, --all", "shorthand for all options")
  .showHelpAfterError()
  .action((opts) => {
    console.log("opts: ", opts);

    const clean = opts.all || opts.clean;
    const build = opts.all || opts.build;
    const config = opts.all || opts.config;
    const domain = opts.domain;

    // Commands for all frapps
    if (clean) {
      console.log("Cleaning ornode build");
      // TODO: @ordao implement this command
      exec("npm run clean", orclientDocsDir);
    }
    if (build) {
      console.log("Building orclient-docs");
      // TODO: build only orclient-docs and not the whole ordao monorepo
      exec("npm run build", ordaoDir);
    }
    if (config) {
      configure(domain);
    }
  });

function configure(domain: string) {
  console.log("Configuring orclient-docs");
  mkSitesDir();
  const s = endent`
  server {
    listen 443 ssl;
    server_name orclient-docs.${domain};

    location / {
      root ${orclientDocsBuildDir}
      index index.html;
    }
  }
  `
  const p = siteFile("orclient-docs"); 
  fs.writeFileSync(p, s);
  console.log("Wrote nginx server block for orclient-docs: ", p);
}
