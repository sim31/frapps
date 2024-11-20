import shelljs from "shelljs";

const docCmd = `cd $npm_package_config_orclient && \
  npx typedoc ./src/orclient.ts \
  --name "orconsole" \
  --readme "../ordao/console/DOCS-INDEX.md" \
  --customFooterHtml "<script type="module" src="/src/index.ts"></script>"\
  --out "../ordao/console/" \
  `

shelljs.exec(docCmd);