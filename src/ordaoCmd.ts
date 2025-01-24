import { Command } from "commander";
import { ordaoContractsCmd } from "./ordaoContractsCmd";

export const ordaoCmd = new Command("ordao")

ordaoCmd
  .addCommand(ordaoContractsCmd);
