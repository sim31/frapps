import { Command } from "commander";
import { ordaoContractsCmd } from "./ordaoContractsCmd.js";
import { ordaoOrnodeCmd } from "./ordaoOrnodeCmd.js";
import { ordaoInit } from "./ordaoInit.js";
import { ordaoOrclientDocsCmd } from "./ordaoOrclientDocsCmd.js";

export const ordaoCmd = new Command("ordao")

ordaoCmd
  .addCommand(ordaoInit) // TODO: test
  .addCommand(ordaoContractsCmd)
  .addCommand(ordaoOrnodeCmd)
  .addCommand(ordaoOrclientDocsCmd)
