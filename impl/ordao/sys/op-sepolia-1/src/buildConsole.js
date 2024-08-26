import jsonfile from "jsonfile";
import shelljs from "shelljs";

// NOTE: don't forget to run typedoc in watch mode in parallel (see watchOrclientDocs.js)

const dCfg = jsonfile.readFileSync("../../sc-deployment/ignition/deployments/op-sepolia-1/deployed_addresses.json");
const dparams = jsonfile.readFileSync("./deployment-params.json");

const docCmd = `cd $npm_package_config_orclient && \
  npx typedoc ./src/orclient.ts \
  --name "orconsole" \
  --readme "../ordao/console/DOCS-INDEX.md" \
  --customFooterHtml "<script type="module" src="/src/index.ts"></script>"\
  --out "../ordao/console/build" \
  `

shelljs.exec(docCmd);

const copyCmd = `cd $npm_package_config_ordao_console && \
  cp tsconfig.json build/ && \
  cp tsconfig.node.json build/ && \
  cp vite.config.ts build/ && \
  cp -r src build/
`

shelljs.exec(copyCmd);

const consoleCmd = `cd $npm_package_config_ordao_console && \
  VITE_OLD_RESPECT_ADDR=${dparams['Orec']['oldRespectAddr']} \
  VITE_NEW_RESPECT_ADDR=${dCfg['Ordao#Respect1155']} \
  VITE_OREC_ADDR=${dCfg['Orec#Orec']} \
  VITE_ORNODE_URL=https://test1-ornode.frapps.xyz \
  VITE_APP_TITLE="ORConsole Test 1" \
  \
  npm run build build/
  `;

// cp public/index.html dist/index.html

shelljs.exec(consoleCmd);

const copyAssets = `cd $npm_package_config_ordao_console && \
  cp -r build/assets/* build/dist/assets/ \
`

shelljs.exec(copyAssets);

