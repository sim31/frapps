import { Command } from "commander";

export const ordaoCmd = new Command("ordao").action(() => {
  console.log("Hello!")
});
