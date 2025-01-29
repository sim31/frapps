import { execaSync, parseCommandString } from "execa";

export function execJoinedCommand(cmd: string, separator = "&&") {
  const cmds = cmd.split(separator);
  cmds.forEach((cmd) => {
    exec(cmd);
  });
}

export function exec(cmd: string, cwd?: string) {
  console.log("Executing: ", cmd, "from: ", cwd);
  const cmdArr = parseCommandString(cmd);
  execaSync({ stdio: "inherit", cwd })`${cmdArr}`;
}