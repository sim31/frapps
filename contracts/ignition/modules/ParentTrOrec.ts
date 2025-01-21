import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ParentOwnershipTransferred from "./ParentOwnershipTransferred";

export default buildModule("ParentTrOrec", (m) => {
  const { parentRespect } = m.useModule(ParentOwnershipTransferred);
  const votePeriod = m.getParameter("votePeriod");
  const vetoPeriod = m.getParameter("vetoPeriod");
  const voteThreshold = m.getParameter("voteThreshold");
  const maxLiveYesVotes = m.getParameter("maxLiveYesVotes");

  const orec = m.contract("Orec", [
    parentRespect,
    votePeriod,
    vetoPeriod,
    voteThreshold,
    maxLiveYesVotes
  ]);

  return { orec, parentRespect };
});