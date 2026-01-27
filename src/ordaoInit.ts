import { Command } from "commander";
import { exec } from "./exec.js";
import { ordaoDir } from "./ordaoPaths.js";

export const ordaoInit = new Command("init").action(() => {
  exec("npm install", { cwd: ordaoDir });  
})