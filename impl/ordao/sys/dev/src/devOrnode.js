import jsonfile from "jsonfile";
import shelljs from "shelljs";

async function main() {
  const d = jsonfile.readFileSync("./tmp/dev-deployment.json");
  const tokenCfg = jsonfile.readFileSync("./dev-token-cfg.json");
  const config = {
    providerUrl: d.providerUrl,
    contracts: {
      newRespect: d.newRespectAddr,
      orec: d.orecAddr
    },
    tokenMetadataCfg: tokenCfg,
    mongoCfg: {
      url: 'mongodb://localhost:27017',
      dbName: "ornode-dev"
    },
    ornode: {
      startPeriodNum: 0,
    }
  };

  const sync = process.argv[2] === '--sync';

  if (sync) {
    config.ornode.sync = {
      fromBlock: 480
    }
  }

  jsonfile.writeFileSync("./tmp/ornode-dev-cfg.json", config);

  // shelljs.exec("cd $npm_package_config_ornode && ORNODE_CFG_PATH=../ordao/sys/tmp/ornode-dev-cfg.json npx nodemon --watch node_modules/ortypes node_modules/ts-utils dist/index.js");
  console.log("we're in devOrnode!");
  if (sync) {
    shelljs.exec(`cd $npm_package_config_ornode && \
      ORNODE_CFG_PATH=$npm_package_config_ornode_to_cfg_path \
      \
      node dist/index.js`
    );
  } else {
    shelljs.exec(`cd $npm_package_config_ornode && \
      ORNODE_CFG_PATH=$npm_package_config_ornode_to_cfg_path \
      \
      npx nodemon \
      --watch ../ortypes/dist \
      --watch ../ts-utils/dist \
      --watch ../respect1155/sc/dist \
      --watch ../orec/dist/ \
      --watch ./ \
      \
      --delay 3
      \
      dist/index.js`
    );
  }
}

main();