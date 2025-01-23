import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ParentExists", (m) => {
  const parentRespect = m.contractAt("ERC20", m.getParameter("address"));

  return { parentRespect };
});