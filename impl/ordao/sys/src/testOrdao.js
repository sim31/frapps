import shelljs from "shelljs";
import concurrently from "concurrently";
import { sleep } from "ts-utils";
import treeKill from "tree-kill";

async function main() {
  try {
    const hhNode = shelljs.exec("npm run hh-test-chain > ./tmp/chain-test.log", { async: true });

    shelljs.exec("npm run build")

    shelljs.exec("npm run test-deployment"); // Synchronous

    // Using concurrently just for prefix in the outputs
    const ornode = concurrently([
      "npm:ornode-dev",
    ]);

    shelljs.exec("npm run hh-test-ordao");

    hhNode.on("exit", (code, signal) => {
      console.log("hhNode process exiting with code: ", code, ", signal: ", signal);
    });

    // ornode.on("exit", (code, signal) => {
    //   console.log("ornode process exiting with code: ", code, ", signal: ", signal);
    // });

    treeKill(hhNode.pid);
    treeKill(ornode.commands[0].pid);
  } catch (err) {
    console.error(err);
  }
}

main();

