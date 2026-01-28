import { Command } from "commander";
import { extAppConfigCmd } from "./extAppConfig.js";

export const externalAppCmd = new Command("externalApp");

externalAppCmd.addCommand(extAppConfigCmd);
