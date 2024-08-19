import jsonfile from "jsonfile";
import shelljs from "shelljs";

// NOTE: don't forget to run typedoc in watch mode in parallel (see watchOrclientDocs.js)

const dCfg = jsonfile.readFileSync("./tmp/dev-deployment.json");

const consoleCmd = `cd $npm_package_config_ordao_console && \
  VITE_OLD_RESPECT_ADDR=${dCfg.oldRespectAddr} \
  VITE_NEW_RESPECT_ADDR=${dCfg.newRespectAddr} \
  VITE_OREC_ADDR=${dCfg.orecAddr} \
  VITE_ORNODE_URL=http://localhost:8090 \
  \
  npm run dev -- --clearScreen false --port 5174`;

shelljs.exec(consoleCmd);
