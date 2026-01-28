import { Command } from "commander";
import { ordaoCommands } from "./ordaoCmd.js";
import { externalAppCmd } from "./externalAppCmd.js";

const program = new Command("orfrapps");

for (const cmd of ordaoCommands) {
  program.addCommand(cmd);
}

program.addCommand(externalAppCmd);

program.parse()