import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
// @ts-ignore
import Orec from "../../../../../orec/artifacts/contracts/Orec.sol/Orec.json" with { type: 'json' }


export default buildModule("Orec", (m) => {
  const oldRespectAddr = m.getParameter("oldRespectAddr");
  const votePeriod = m.getParameter("votePeriod");
  const vetoPeriod = m.getParameter("vetoPeriod");
  const voteThreshold = m.getParameter("voteThreshold");
  const maxLiveYesVotes = m.getParameter("maxLiveYesVotes");

  const orec = m.contract("Orec", Orec, [
    oldRespectAddr,
    votePeriod,
    vetoPeriod,
    voteThreshold,
    maxLiveYesVotes
  ]);

  return { orec };
});