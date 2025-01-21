import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ParentRespect from "./ParentFractalRespect";

export default buildModule("ParentOrec", (m) => {
  const { parentRespect } = m.useModule(ParentRespect);
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