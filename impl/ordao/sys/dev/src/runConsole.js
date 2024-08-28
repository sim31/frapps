import jsonfile from "jsonfile";
import shelljs from "shelljs";

// NOTE: don't forget to run typedoc in watch mode in parallel (see watchOrclientDocs.js)

const dCfg = jsonfile.readFileSync("./tmp/dev-deployment.json");
const buildDirFromOrclient = "../ordao/console/build/dev"
const buildDir = "build/dev/"

const docCmd = `cd $npm_package_config_orclient && \
  npx typedoc ./src/orclient.ts \
  --name "orconsole" \
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
  VITE_OLD_RESPECT_ADDR=${dCfg.oldRespectAddr} \
  VITE_NEW_RESPECT_ADDR=${dCfg.newRespectAddr} \
  VITE_OREC_ADDR=${dCfg.orecAddr} \
  VITE_ORNODE_URL=http://localhost:8090 \
  VITE_APP_TITLE="ORConsole dev" \
  \
  npm run build ${buildDir}
  `;

// cp public/index.html dist/index.html

shelljs.exec(consoleCmd);

const copyAssets = `cd $npm_package_config_ordao_console && \
  cp -r ${buildDir}/assets/* ${buildDir}/dist/assets/ \
`

shelljs.exec(copyAssets);

const run = `cd $npm_package_config_ordao_console &&
  npm run preview ${buildDir} -- --port 5174 --clearScreen false \
`
shelljs.exec(run)