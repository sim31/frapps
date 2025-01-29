import { appDir } from "./paths.js"
import path from "path";
import fs from "fs";

export const ordaoDir = appDir("ordao");
export const ornodeDir = path.join(ordaoDir, "services/ornode");
export const orclientDocsDir = path.join(ordaoDir, "apps/orclient-docs");
export const orclientDocsBuildDir = path.join(orclientDocsDir, "dist");

export const guiDir = path.join(ordaoDir, "apps/gui");
// Making it different from "dist" so that it is different from what ordao repo uses for dev / test builds
export const guiBuildsDir = path.join(guiDir, "builds");

console.log("guiBuildsDir: ", guiBuildsDir);

export const guiBuildCfgsDir = guiBuildsDir;

export function guiBuildCfgDir(frappId: string) {
  return path.join(guiBuildCfgsDir, `${frappId}.json`);
}

export function guiBuildDir(frappId: string) {
  return path.join(guiBuildsDir, frappId);
}

export function mkGuiBuildsDir() {
  if (!fs.existsSync(guiBuildsDir)) {
    fs.mkdirSync(guiBuildsDir, { recursive: true });
  }
}

export function mkGuiBuildDir(frappId: string) {
  const p = guiBuildDir(frappId);
  console.log("making dir: ", p);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
  return p;
}

