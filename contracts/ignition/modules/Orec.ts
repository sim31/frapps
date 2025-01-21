import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Orec", (m) => {
  const parentAddr = m.getParameter("parentAddr");
  const votePeriod = m.getParameter("votePeriod");
  const vetoPeriod = m.getParameter("vetoPeriod");
  const voteThreshold = m.getParameter("voteThreshold");
  const maxLiveYesVotes = m.getParameter("maxLiveYesVotes");

  const orec = m.contract("Orec", [
    parentAddr,
    votePeriod,
    vetoPeriod,
    voteThreshold,
    maxLiveYesVotes
  ]);

  return { orec };
});