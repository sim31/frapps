import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SolidRespect", (m) => {
  const name = m.getParameter("name");
  const symbol = m.getParameter("symbol");
  const addresses = m.getParameter("addresses");
  const balances = m.getParameter("balances");

  const solidRespect = m.contract("SolidRespect", [
    name, symbol, addresses, balances
  ]);

  return { solidRespect };
});