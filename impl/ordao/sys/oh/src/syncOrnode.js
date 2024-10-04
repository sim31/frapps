import jsonfile from "jsonfile";
import shelljs from "shelljs";

const config = jsonfile.readFileSync("./ornode-cfg.json");

console.log("Args: ", process.argv);

config.ornode.sync = {
  fromBlock: process.argv[2],
  toBlock: process.argv[3],
  stepRange: Number(process.argv[4])
}

jsonfile.writeFileSync("./tmp/ornode-sync-cfg.json", config);

shelljs.exec(`cd $npm_package_config_ornode && \
  ORNODE_CFG_PATH=../ordao/sys/oh/tmp/ornode-sync-cfg.json \
  \
  npx nodemon \
  --watch ../../../ortypes/dist \
  --watch ../../../ts-utils/dist \
  --watch ../../../respect1155/sc/dist \
  --watch ../../../orec/dist/ \
  --watch ./ \
  \
  --delay 5
  \
  dist/index.js`
);
