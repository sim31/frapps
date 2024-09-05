import jsonfile from "jsonfile";
import shelljs from "shelljs";

// NOTE: don't forget to run typedoc in watch mode in parallel (see watchOrclientDocs.js)

const dCfg = jsonfile.readFileSync("../../sc-deployment/ignition/deployments/of/deployed_addresses.json");
const dparams = jsonfile.readFileSync("./deployment-params.json");
const chainInfo = jsonfile.readFileSync("./chain-info.json")

const cmd = `cd $npm_package_config_ordao_gui && \
  VITE_OLD_RESPECT_ADDR=${dparams['Orec']['oldRespectAddr']} \
  VITE_NEW_RESPECT_ADDR=${dCfg['Ordao#Respect1155']} \
  VITE_OREC_ADDR=${dCfg['Orec#Orec']} \
  VITE_ORNODE_URL=https://of2-ornode.frapps.xyz \
  VITE_APP_TITLE="ORDAO (Optimism Fractal)" \
  \
  VITE_CHAIN_ID='${chainInfo.chainId}' \
  VITE_RPC_URLS='${JSON.stringify(chainInfo.rpcUrls)}' \
  VITE_CHAIN_NAME='${chainInfo.chainName}' \
  VITE_BLOCKEXP_URL='${chainInfo.blockExplorerUrl}' \
  \
  npm run build
  `;

shelljs.exec(cmd);