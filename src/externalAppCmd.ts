import { Command } from "commander";

export const externalAppCmd = new Command("externalApp").action(() => {
  throw new Error("Not Implemented");
});
