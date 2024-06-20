import shelljs from "shelljs";
import { sleep } from "ts-utils";

async function main() {
  const hhNode = shelljs.exec("npm run hh-test-chain", { async: true });
  await sleep(3000);

  shelljs.exec("npm run test-deployment"); // Synchronous
  // const ornode = shelljs.exec("npm run ornode-dev", { async: true });
  const tests = shelljs.exec("npm run hh-test-ordao"); // Synchronous

  hhNode.on("exit", (code, signal) => {
    console.log("hhNode process exiting with code: ", code, ", signal: ", signal);
  });

  // ornode.on("exit", (code, signal) => {
  //   console.log("ornode process exiting with code: ", code, ", signal: ", signal);
  // });

  hhNode.kill();
  // ornode.kill();

}

main();
