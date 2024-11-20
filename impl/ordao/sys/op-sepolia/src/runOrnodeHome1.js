import shelljs from "shelljs";

shelljs.exec(`cd $npm_package_config_ornode && \
  ORNODE_CFG_PATH=$npm_package_config_ornode_to_home1_cfg_path \
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
