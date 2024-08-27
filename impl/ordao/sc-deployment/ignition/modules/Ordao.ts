import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import OrecModule from "./Orec";
// @ts-ignore
import Respect1155 from "../../../../respect1155/sc/artifacts/contracts/Respect1155.sol/Respect1155.json" with { type: 'jsong' }

export default buildModule("Ordao", (m) => {
  const { orec } = m.useModule(OrecModule)

  const uri = m.getParameter("uri");
  const contractURI = m.getParameter("contractURI");

  const newRespect = m.contract("Respect1155", Respect1155, [
    orec,
    uri,
    contractURI
  ]);

  return { orec, newRespect };
});