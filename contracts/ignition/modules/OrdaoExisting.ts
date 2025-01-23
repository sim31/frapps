import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OrdaoExisting", (m) => {
  const oldRespect = m.contractAt("ERC20", m.getParameter("oldRespect"));
  const orec = m.contractAt("Orec", m.getParameter("orec"));
  const r1155 = m.contractAt("Respect1155", m.getParameter("newRespect"));

  return { oldRespect, orec, r1155 };
});