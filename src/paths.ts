import path from "path";
import fs from "fs";

export const fractalsDir = path.join(import.meta.dirname, "../fractals");
export const contractsDir = path.join(import.meta.dirname, "../contracts");
export const ignitionDir = path.join(contractsDir, "ignition");
export const ignitionModulesDir = path.join(ignitionDir, "modules");
export const ignitionDeploymentsDir = path.join(ignitionDir, "deployments");

export const distDir = path.join(import.meta.dirname, "../dist");
export const deploymentsDir = path.join(distDir, "deployments");
export const procDir = path.join(distDir, "proc");
export const sitesDir = path.join(distDir, "sites");

export const appsDir = path.join(import.meta.dirname, "../apps");

export function ignitionCfgPath(frappId: string, ext?: string) {
  if (ext === undefined) {
    return path.join(ignitionDir, `${frappId}.json`); 
  } else {
    return path.join(ignitionDir, `${frappId}.${ext}.json`);
  }
}

export function ignitionModulePath(moduleName: string) {
  return path.join(ignitionModulesDir, `${moduleName}.ts`);
}

export function ignitionDeployedAddrs(frappId: string) {
  return path.join(ignitionDeploymentsDir, `${frappId}/deployed_addresses.json`);
}

export function mkDeploymentsDir() {
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
}

export function mkProcDir(frappId: string) {
  if (!fs.existsSync(frappProcDir(frappId))) {
    fs.mkdirSync(frappProcDir(frappId), { recursive: true });
  }
}

export function mkSitesDir() {
  if (!fs.existsSync(sitesDir)) {
    fs.mkdirSync(sitesDir, { recursive: true });
  }
}

export function siteFile(siteFileName: string, frappId?: string) {
  const filename = frappId ? `${siteFileName}.${frappId}.conf` : `${siteFileName}.conf`;
  return path.join(sitesDir, filename);
}

export function deploymentFile(frappId: string) {
  return path.join(deploymentsDir, `${frappId}.json`);
}

export function frappProcDir(frappId: string) {
  return path.join(procDir, frappId);
}

export function procFilepath(frappId: string, procFileName: string) {
  return path.join(frappProcDir(frappId), `${procFileName}.json`);
}

export function appDir(appId: string) {
  return path.join(appsDir, appId);
}

export function fractalDir(fractalId: string) {
  return path.join(fractalsDir, fractalId);
}

export function frappFile(frappId: string) {
  return path.join(fractalDir(frappId), "frapp.json")
}

export function localFrappFile(frappId: string) {
  return path.join(fractalDir(frappId), "frapp.local.json");
}

export function mkDir(p: string) {
  console.log("making dir: ", p);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
  return p;
}

