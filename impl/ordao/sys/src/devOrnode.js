import jsonfile from "jsonfile";
import shelljs from "shelljs";

async function main() {
  const d = jsonfile.readFileSync("./tmp/dev-deployment.json");
  const config = {
    providerUrl: d.providerUrl,
    contracts: {
      newRespect: d.newRespectAddr,
      orec: d.orecAddr
    }
  };
  jsonfile.writeFileSync("./tmp/ornode-dev-cfg.json", config);

  shelljs.exec("cd $npm_package_config_ornode && ORNODE_CFG_PATH=../ordao/sys/tmp/ornode-dev-cfg.json npx nodemon dist/index.js");
}

main();
v