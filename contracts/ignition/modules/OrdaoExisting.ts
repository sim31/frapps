import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OrdaoExisting", (m) => {
  // Contract type is irrelevant here - could be ERC20 or Respect1155
  const oldRespect = m.contractAt("Respect1155", m.getParameter("oldRespect"));
  const orec = m.contractAt("Orec", m.getParameter("orec"));
  const r1155 = m.contractAt("Respect1155", m.getParameter("newRespect"));

  return { oldRespect, orec, r1155 };
});