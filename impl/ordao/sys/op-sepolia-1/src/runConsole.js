import jsonfile from "jsonfile";
import shelljs from "shelljs";

// NOTE: don't forget to run typedoc in watch mode in parallel (see watchOrclientDocs.js)

const dCfg = jsonfile.readFileSync("../../sc-deployment/ignition/deployments/op-sepolia-1/deployed_addresses.json");
const dparams = jsonfile.readFileSync("./deployment-params.json");

const consoleCmd = `cd $npm_package_config_ordao_console && \
  VITE_OLD_RESPECT_ADDR=${dparams['Orec']['oldRespectAddr']} \
  VITE_NEW_RESPECT_ADDR=${dCfg['Ordao#Respect1155']} \
  VITE_OREC_ADDR=${dCfg['Orec#Orec']} \
  VITE_ORNODE_URL=http://localhost:8090 \
  \
  npm run dev -- --port 5173`;

shelljs.exec(consoleCmd);
