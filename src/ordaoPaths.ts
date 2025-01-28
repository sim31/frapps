import { appDir } from "./paths.js"
import path from "path";

export const ordaoDir = appDir("ordao");
export const ornodeDir = path.join(ordaoDir, "services/ornode");

