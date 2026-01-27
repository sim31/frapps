import { Command } from "commander";
import { ordaoCommands } from "./ordaoCmd.js";

const program = new Command("frapps");

for (const cmd of ordaoCommands) {
  program.addCommand(cmd);
}

program.parse()