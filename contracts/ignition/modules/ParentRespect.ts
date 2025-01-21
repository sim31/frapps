import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ParentRespect", (m) => {
  const parentRespect = m.contract(
    "Respect1155",
    [
      m.getAccount(0),  // owner
      m.getParameter("uri"),
      m.getParameter("contractURI")
    ]
  )

  const mintReqs = m.getParameter("mintRequests");
  const data = m.getParameter("data", "0x");
  m.call(parentRespect, "mintRespectGroup", [mintReqs, data]);

  return { parentRespect };
});