import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import Orec from "./Orec";

export default buildModule("OrecRespect1155", (m) => {
  const { orec } = m.useModule(Orec)

  const uri = m.getParameter("uri");
  const contractURI = m.getParameter("contractURI");

  const respect1155 = m.contract("Respect1155", [
    orec,
    uri,
    contractURI
  ]);

  return { respect1155, orec };
});