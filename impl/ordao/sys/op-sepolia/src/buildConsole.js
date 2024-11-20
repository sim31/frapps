import jsonfile from "jsonfile";
import shelljs from "shelljs";

// NOTE: don't forget to run typedoc in watch mode in parallel (see watchOrclientDocs.js)

const dCfg = jsonfile.readFileSync("../../sc-deployment/ignition/deployments/op-sepolia/deployed_addresses.json");
const dparams = jsonfile.readFileSync("./deployment-params.json");
const chainInfo = jsonfile.readFileSync("./chain-info.json")

const buildDirFromOrclient = "../ordao/console/build/op-sepolia"
const buildDir = "build/op-sepolia"

const docCmd = `cd $npm_package_config_orclient && \
  npx typedoc ./src/orclient.ts \
  --name "ORConsole (OP Sepolia)" \
  --readme "../ordao/console/DOCS-INDEX.md" \
  --customFooterHtml "<script type="module" src="/src/index.ts"></script>"\
  --out ${buildDirFromOrclient} \
  `

shelljs.exec(docCmd);

const copyCmd = `cd $npm_package_config_ordao_console && \
  cp tsconfig.json ${buildDir} && \
  cp tsconfig.node.json ${buildDir} && \
  cp vite.config.ts ${buildDir} && \
  cp -r src ${buildDir}
`

shelljs.exec(copyCmd);

const consoleCmd = `cd $npm_package_config_ordao_console && \
  VITE_OLD_RESPECT_ADDR=${dparams['Orec']['oldRespectAddr']} \
  VITE_NEW_RESPECT_ADDR=${dCfg['Ordao#Respect1155']} \
  VITE_OREC_ADDR=${dCfg['Orec#Orec']} \
  VITE_ORNODE_URL=https://op-sepolia-ornode.frapps.xyz \
  VITE_APP_TITLE="ORConsole (OP Sepolia)" \
  \
  VITE_CHAIN_ID='${chainInfo.chainId}' \
  VITE_RPC_URLS='${JSON.stringify(chainInfo.rpcUrls)}' \
  VITE_CHAIN_NAME='${chainInfo.chainName}' \
  VITE_BLOCKEXP_URL='${chainInfo.blockExplorerUrl}' \
  \
  npm run build ${buildDir}
  `;

// cp public/index.html dist/index.html

shelljs.exec(consoleCmd);

const copyAssets = `cd $npm_package_config_ordao_console && \
  cp -r ${buildDir}/assets/* ${buildDir}/dist/assets/ \
`

shelljs.exec(copyAssets);

