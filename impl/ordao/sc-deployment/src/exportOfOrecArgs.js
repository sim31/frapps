// For use with hardhat verify
const jsonfile = require("jsonfile");

const params = jsonfile.readFileSync("../ordao/sys/of/deployment-params.json");

console.log(params);

module.exports = [
  params.Orec.oldRespectAddr,
  params.Orec.votePeriod,
  params.Orec.votePeriod,
  params.Orec.voteThreshold,
  params.Orec.maxLiveYesVotes
]

