import { Command } from "commander";
import { ordaoCommands } from "./ordaoCmd.js";

const program = new Command("orfrapps");

for (const cmd of ordaoCommands) {
  program.addCommand(cmd);
}

program.parse()