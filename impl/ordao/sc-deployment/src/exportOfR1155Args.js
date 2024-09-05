// For use with hardhat verify
const jsonfile = require("jsonfile");

const params = jsonfile.readFileSync("../../ordao/sys/of/deployment-params.json");
const deployedAddrs = jsonfile.readFileSync("../../ordao/sc-deployment/ignition/deployments/of/deployed_addresses.json");

console.log(params);

module.exports = [
  deployedAddrs['Orec#Orec'],
  params.Ordao.uri,
  params.Ordao.contractURI
]
