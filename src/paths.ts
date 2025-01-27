import path from "path";
import fs from "fs";

export const fractalsDir = path.join(import.meta.dirname, "../fractals");
export const contractsDir = path.join(import.meta.dirname, "../contracts");
export const ignitionDir = path.join(contractsDir, "ignition");
export const ignitionModulesDir = path.join(ignitionDir, "modules");
export const ignitionDeploymentsDir = path.join(ignitionDir, "deployments");

export const deploymentsDir = path.join(import.meta.dirname, "../dist/deployments");

export function ignitionCfgPath(frappId: string) {
  return path.join(ignitionDir, `${frappId}.json`); 
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

export function deploymentFile(frappId: string) {
  return path.join(deploymentsDir, `${frappId}.json`);
}

