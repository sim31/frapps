import { Command } from "commander";
import { ordaoCmd } from "./ordaoCmd.js";
import { externalAppCmd } from "./externalAppCmd.js";

// * Each app (repo within apps) should have a sub-command. It's up to that subcommand to take care of all of the steps involved in building, running, maintaining the app processes for fractals that request it.
// * So each subcommand defines it's own options;
// * It's totally up to app subcommands to decide how to build and everything and prepare;
// * So you have flexibility for all types of apps to handle their own unique demands (e.g.: for ordao you can build server side component after building gui for each fractal, but for something like respect.games you would probably have to process all the frapps configs first and then build respect.games) while still being able to re-use code

const program = new Command("frapps");
program
  .addCommand(ordaoCmd)
  .addCommand(externalAppCmd);

program.parse()