import shelljs from "shelljs";
import { sleep } from "ts-utils";

async function main() {
  const hhNode = shelljs.exec("npm run hh-dev-chain > ./tmp/chain-dev.log", { async: true });
  await sleep(1000);

  shelljs.exec("npm run dev-deployment"); // Synchronous

  shelljs.exec("npm run dev-servers");
}

main();