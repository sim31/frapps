import shelljs from "shelljs";
import { sleep } from "ts-utils";

async function main() {
  const hhNode = shelljs.exec("npm run hh-dev-chain > ./tmp/chain-dev.log", { async: true });
  await sleep(1000);

  // Running on fresh db because the chain is new as well
  shelljs.exec("npm run dev-mongod-clean", { async: true });

  shelljs.exec("npm run dev-deployment"); // Synchronous

  if (process.argv[2] === "--no-vite") {
    shelljs.exec("npm run dev-servers-no-vite");
  } else {
    shelljs.exec("npm run dev-servers");
  }
}

main();