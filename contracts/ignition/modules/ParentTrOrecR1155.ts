import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ParentTrOrec from "./ParentTrOrec";

export default buildModule("ParentTrOrecRespect1155", (m) => {
  const { parentRespect, orec } = m.useModule(ParentTrOrec)

  const uri = m.getParameter("uri");
  const contractURI = m.getParameter("contractURI");

  const respect1155 = m.contract("Respect1155", [
    orec,
    uri,
    contractURI
  ]);

  return { parentRespect, respect1155, orec };
});