import { Command } from "commander";
import { ordaoContractsCmd } from "./ordaoContractsCmd.js";

export const ordaoCmd = new Command("ordao")

ordaoCmd
  .addCommand(ordaoContractsCmd);
