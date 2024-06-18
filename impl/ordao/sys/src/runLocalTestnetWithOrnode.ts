import { LocalTestnet } from "./localTestnet.js";
import jsonfile from "jsonfile";
import { Config } from "ornode";
import shelljs from "shelljs";

const ornodeCfgPath = "../../ornode/dev-cfg.json"

async function main() {
  const t = await LocalTestnet.create();
  const ornodeCfg: Config = {
    contracts: {
      newRespect: t.state.newRespectAddr,
      oldRespect: t.state.oldRespectAddr,
      orec: t.state.orecAddr
    }
  };
  jsonfile.writeFileSync(ornodeCfgPath, ornodeCfg);

  shelljs.exec("npm run ornode-dev");
}

main();