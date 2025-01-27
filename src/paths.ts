import path from "path"

export const fractalsDir = path.join(import.meta.dirname, "../fractals");
export const contractsDir = path.join(import.meta.dirname, "../contracts");
export const ignitionDir = path.join(contractsDir, "ignition");
export const ignitionModulesDir = path.join(ignitionDir, "modules");
export const ignitionDeploymentsDir = path.join(ignitionDir, "deployments");

export function ignitionCfgPath(frappId: string) {
  return path.join(ignitionDir, `${frappId}.json`); 
}

export function ignitionModulePath(moduleName: string) {
  return path.join(ignitionModulesDir, `${moduleName}.ts`);
}
