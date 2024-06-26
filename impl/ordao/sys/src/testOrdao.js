import shelljs from "shelljs";
import concurrently from "concurrently";
import { sleep } from "ts-utils";
import treeKill from "tree-kill";

async function main() {
  try {
    const hhNode = shelljs.exec("npm run hh-test-chain > ./tmp/chain-test.log", { async: true });

    shelljs.exec("npm run build")

    shelljs.exec("npm run test-deployment"); // Synchronous

    const dbpath = './tmp/mongodb/testing'
    shelljs.exec(`mkdir -p ${dbpath}`);
    shelljs.exec(`rm -rf ${dbpath}/*`)
    const mongod = shelljs.exec(`mongod --dbpath=${dbpath} > ./tmp/mongod-testing.log`, { async: true });

    // shelljs.exec("npm run setup-mongodb");

    console.debug("ok 3");

    const ornode = shelljs.exec("npm run dev-ornode > ./tmp/ornode-test.log", { async: true })

    shelljs.exec("npm run hh-test-ordao");

    hhNode.on("exit", (code, signal) => {
      console.log("hhNode process exiting with code: ", code, ", signal: ", signal);
    });

    ornode.on("exit", (code, signal) => {
      console.log("ornode process exiting with code: ", code, ", signal: ", signal);
    });

    mongod.on("exit", (code, signal) => {
      console.log("mongod process exiting with code: ", code, ", signal: ", signal);
    });

    shelljs.exec(`mongod --shutdown --dbpath=${dbpath}`)
    treeKill(hhNode.pid);
    treeKill(ornode.pid);
  } catch (err) {
    console.error(err);
  }
}

main();

