import shelljs from "shelljs";

const cmd = `cd $npm_package_config_sc_deployment && \
  npx hardhat ignition deploy \
    --parameters $npm_package_config_sc_deployment_to_params \
    --deployment-id op-sepolia-1 \
    --network opSepolia \
    ignition/modules/Ordao.ts
`

shelljs.exec(cmd);
