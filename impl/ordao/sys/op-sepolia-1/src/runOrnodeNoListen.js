import jsonfile from "jsonfile";
import shelljs from "shelljs";

const config = jsonfile.readFileSync("./ornode-cfg.json");

console.log("Args: ", process.argv);

config.ornode.listenForEvents = false;

jsonfile.writeFileSync("./tmp/ornode-no-listen-cfg.json", config);

shelljs.exec(`cd $npm_package_config_ornode && \
  ORNODE_CFG_PATH=../ordao/sys/op-sepolia-1/tmp/ornode-no-listen-cfg.json \
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
