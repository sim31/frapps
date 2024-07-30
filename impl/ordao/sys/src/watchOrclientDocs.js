import shelljs from "shelljs";

const docCmd = `cd $npm_package_config_ordao_console && \
  npx typedoc src/orconsole.ts \
  --customFooterHtml "<script type="module" src="/src/index.ts"></script>"\
  --out "public/" \
  --watch \
  --preserveWatchOutput`

shelljs.exec(docCmd);