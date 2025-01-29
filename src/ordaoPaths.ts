import { appDir } from "./paths.js"
import path from "path";

export const ordaoDir = appDir("ordao");
export const ornodeDir = path.join(ordaoDir, "services/ornode");
export const orclientDocsDir = path.join(ordaoDir, "apps/orclient-docs");
export const orclientDocsBuildDir = path.join(orclientDocsDir, "dist");

