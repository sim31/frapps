import { Command } from "commander";
import { ordaoContractsCmd } from "./ordaoContractsCmd.js";
import { ordaoOrnodeCmd } from "./ordaoOrnodeCmd.js";
import { ordaoOrclientDocsCmd } from "./ordaoOrclientDocsCmd.js";
import { ordaoGuiCmd } from "./ordaoGuiCmd.js";
import { ordaoOrnodeSyncCmd } from "./ordaoOrnodeSyncCmd.js";
import { ordaoRSplitsCmd } from "./ordaoRSplit.js";
import { ordaoParentDeployCmd } from "./ordaoParentDeployCmd.js";

export const ordaoCommands: Command[] = [
  ordaoContractsCmd,
  ordaoOrnodeCmd,
  ordaoOrclientDocsCmd,
  ordaoGuiCmd,
  ordaoOrnodeSyncCmd,
  ordaoRSplitsCmd,
  ordaoParentDeployCmd,
];
