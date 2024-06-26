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

  // shelljs.exec("cd $npm_package_config_ornode && ORNODE_CFG_PATH=../ordao/sys/tmp/ornode-dev-cfg.json npx nodemon --watch node_modules/ortypes node_modules/ts-utils dist/index.js");
  console.log("we're in devOrnode!");
  shelljs.exec(`cd $npm_package_config_ornode && \
    ORNODE_CFG_PATH=../ordao/sys/tmp/ornode-dev-cfg.json \
    \
    npx nodemon \
    --watch ../ortypes/dist \
    --watch ../ts-utils/dist \
    --watch ../respect1155/sc/dist \
    --watch ../orec/dist/ \
    --watch ./ \
    \
    --delay 5
    \
    dist/index.js`
  );
}

main();