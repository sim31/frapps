import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Orec", (m) => {
  const oldRespectAddr = m.getParameter("oldRespectAddr");
  const votePeriod = m.getParameter("votePeriod");
  const vetoPeriod = m.getParameter("vetoPeriod");
  const voteThreshold = m.getParameter("voteThreshold");
  const maxLiveYesVotes = m.getParameter("maxLiveYesVotes");

  // Contract type is irrelevant here - could be ERC20 or Respect1155
  const oldRespect = m.contractAt("Respect1155", oldRespectAddr);

  const orec = m.contract("Orec", [
    oldRespectAddr,
    votePeriod,
    vetoPeriod,
    voteThreshold,
    maxLiveYesVotes
  ]);

  return { orec, oldRespect };
});