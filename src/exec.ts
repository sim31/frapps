import { execaSync, parseCommandString } from "execa";
import { SyncOptions } from "execa";

export function execJoinedCommand(cmd: string, separator = "&&") {
  const cmds = cmd.split(separator);
  cmds.forEach((cmd) => {
    exec(cmd);
  });
}

export function exec(cmd: string, opts?: SyncOptions) {
  const options = {
    stdio: opts?.stdio ?? "inherit",
    ...opts
  }
  console.log("Executing: ", cmd, "with options: ", options);
  const cmdArr = parseCommandString(cmd);
  execaSync(options)`${cmdArr}`;
}