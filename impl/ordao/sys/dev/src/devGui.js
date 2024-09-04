import jsonfile from "jsonfile";
import shelljs from "shelljs";

const dCfg = jsonfile.readFileSync("./tmp/dev-deployment.json");
const chainInfo = jsonfile.readFileSync("./chain-info.json")

const cmd = `cd $npm_package_config_ordao_gui && \
  VITE_OLD_RESPECT_ADDR=${dCfg.oldRespectAddr} \
  VITE_NEW_RESPECT_ADDR=${dCfg.newRespectAddr} \
  VITE_OREC_ADDR=${dCfg.orecAddr} \
  VITE_ORNODE_URL=http://localhost:8090 \
  VITE_APP_TITLE="Ordao gui dev" \
  \
  VITE_CHAIN_ID='${chainInfo.chainId}' \
  VITE_RPC_URLS='${JSON.stringify(chainInfo.rpcUrls)}' \
  VITE_CHAIN_NAME='${chainInfo.chainName}' \
  VITE_BLOCKEXP_URL='${chainInfo.blockExplorerUrl}' \
  \
  npm run dev -- --clearScreen false`;

shelljs.exec(cmd);


