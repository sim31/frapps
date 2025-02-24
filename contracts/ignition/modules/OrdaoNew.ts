import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import OrecModule from "./Orec";

export default buildModule("OrdaoNew", (m) => {
  const { orec, oldRespect } = m.useModule(OrecModule)

  const uri = m.getParameter("uri");
  const contractURI = m.getParameter("contractURI");

  const newRespect = m.contract("Respect1155", [
    orec,
    uri,
    contractURI
  ]);

  return { orec, newRespect, oldRespect };
});