import { Command } from "commander";
import { exec } from "./exec.js";
import { appDir } from "./paths.js";

export const ordaoInit = new Command("init").action(() => {
  exec("npm install", { cwd: appDir("ordao") });  
})