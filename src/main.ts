import { Command } from "commander";
import { ordaoCmd } from "./ordaoCmd";
import { externalAppCmd } from "./externalAppCmd";

// * Each app (repo within apps) should have a sub-command. It's up to that subcommand to take care of all of the steps involved in building, running, maintaining the app processes for fractals that request it.
// * So each subcommand defines it's own options;
// * Before passing control to app subcommand frapps gathers all the frapps that specify that app and passes it to the logic of the subcommand;
// * It's totally up to app subcommands to decide how to build and everything and prepare;
// * So you have flexibility for all types of apps to handle their own unique demands (e.g.: for ordao you can build server side component after building gui for each fractal, but for something like respect.games you would probably have to process all the frapps configs first and then build respect.games) while still being able to re-use code

const program = new Command("frapps");
program
  .addCommand(ordaoCmd)
  .addCommand(externalAppCmd);

program.parse()