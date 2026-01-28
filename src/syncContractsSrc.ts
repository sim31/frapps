import fs from "fs";
import path from "path";
import { contractsDir } from "./paths.js";
import { ordaoDir } from "./ordaoPaths.js";

export function syncContractsSrc() {
  const sources: { src: string; dst: string }[] = [
    {
      src: path.join(ordaoDir, "node_modules/op-fractal-sc/contracts"),
      dst: path.join(contractsDir, "src/op-fractal-sc"),
    },
    {
      src: path.join(ordaoDir, "contracts/packages/orec/contracts"),
      dst: path.join(contractsDir, "src/orec"),
    },
    {
      src: path.join(ordaoDir, "contracts/packages/respect1155/contracts"),
      dst: path.join(contractsDir, "src/respect1155"),
    },
    {
      src: path.join(ordaoDir, "contracts/packages/solid-respect/contracts"),
      dst: path.join(contractsDir, "src/solid-respect"),
    },
  ];

  for (const { src, dst } of sources) {
    if (!fs.existsSync(src)) {
      throw new Error(
        `Contracts source directory not found: ${src}. Did you run (1) npm install in repo root and (2) npm install in ./ordao?`,
      );
    }

    fs.rmSync(dst, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(src, dst, { recursive: true });
  }
}
