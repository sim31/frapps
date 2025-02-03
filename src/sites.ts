import { endent } from "./endent.js";
import { mkSitesDir, siteFile } from "./paths.js";
import fs from "fs";


export function createStaticSite(
  rootDir: string,
  domain: string,
  siteName: string,
  root: boolean = false,
  indexFile: string = "index.html"
) {
  mkSitesDir();
  const serverName = root ? domain : `${siteName}.${domain}`;
  const s = endent`
  server {
    listen ${domain === "localhost" ? "80" : "443 ssl"};
    server_name ${serverName};

    location / {
      root ${rootDir};
      index ${indexFile};
    }
  }
  `
  const p = siteFile(siteName);
  fs.writeFileSync(p, s);
  console.log("Wrote nginx server block ", p);
  console.log("Reload nginx, running 'nginx -s reload'");
}

export function createProxySite(
  proxyTo: string,
  domain: string,
  siteName: string,
) {
  mkSitesDir();
  const s = endent`
  server {
    listen ${domain === "localhost" ? "80" : "443 ssl"};
    server_name ${siteName}.${domain};

    location / {
      proxy_pass ${proxyTo};
    }
  }
  `

  const p = siteFile(siteName);
  fs.writeFileSync(p, s);
  console.log("Wrote nginx server block ", p);
  console.log("Reload nginx, running 'nginx -s reload'");
}
