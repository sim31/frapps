import { endent } from "./endent.js";
import { mkSitesDir, siteFile } from "./paths.js";
import fs from "fs";

/**
 * @param domain - Parent domain
 * @param name - The name of the subdomain (of the site). If "" then no subdomain (server name is just `domain`).
 */
export function createServerName(name: string, domain: string) {
  if (name === "") {
    return domain;
  } else {
    return `${name}.${domain}`;
  }
}

function serverNamesFromSiteNames(siteNames: string[], domain: string) {
  const serverNames: string[] = [];
  for (const siteName of siteNames) {
    serverNames.push(createServerName(siteName, domain));
  }
  return serverNames;
}

function serverNamesStrFromSiteNames(siteNames: string[], domain: string) {
  return serverNamesFromSiteNames(siteNames, domain).join(" ");
}

/**
 * @param siteNames - The names of the subdomain (of the site). If "" then no subdomain (server name is just `domain`).
 * Has to have at least one element.
 * The first element is used for creating siteFile. If first element is empty string, then "root" is used as the filename.
 */
export function createStaticSite(
  rootDir: string,
  domain: string,
  siteNames: string[],
  indexFile?: string
): void;
export function createStaticSite(
  rootDir: string,
  domain: string,
  siteNames: string[],
  files: 'spa'
): void;
export function createStaticSite(
  rootDir: string,
  domain: string,
  siteNames: string[],
  files: string | 'spa' | undefined
): void {
  mkSitesDir();
  const serverNamesStr = serverNamesStrFromSiteNames(siteNames, domain);

  let location: string;
  if (files === 'spa') {
    location = endent`
    location / {
      root ${rootDir};
      try_files $uri $uri/ /index.html;
    }`;
  } else {
    const indexFile = files ?? "index.html";
    location = endent`
    location / {
      root ${rootDir};
      index ${indexFile};
    }`;
  }

  const s = endent`
  server {
    listen ${domain === "localhost" ? "80" : "443 ssl"};
    server_name ${serverNamesStr};

    ${location}
  }
  `
  const p = siteFile(siteNames[0] === "" ? "root" : siteNames[0]);
  fs.writeFileSync(p, s);
  console.log("Wrote nginx server block ", p);
  console.log("Reload nginx, running 'nginx -s reload'");
}

/**
 * @param siteNames - The names of the subdomain (of the site). If "" then no subdomain (server name is just `domain`).
 * Has to have at least one element.
 * The first element is used for creating siteFile
 */
export function createProxySite(
  proxyTo: string,
  domain: string,
  siteNames: string[],
) {
  mkSitesDir();
  const serverNamesStr = serverNamesStrFromSiteNames(siteNames, domain);
  const s = endent`
  server {
    listen ${domain === "localhost" ? "80" : "443 ssl"};
    server_name ${serverNamesStr};

    location / {
      proxy_pass ${proxyTo};
    }
  }
  `

  const p = siteFile(siteNames[0] === "" ? "root" : siteNames[0]);
  fs.writeFileSync(p, s);
  console.log("Wrote nginx server block ", p);
  console.log("Reload nginx, running 'nginx -s reload'");
}
