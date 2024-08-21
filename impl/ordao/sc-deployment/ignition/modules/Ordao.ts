import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import OrecModule from "./Orec.js";
import Respect1155 from "../../../../respect1155/sc/artifacts/contracts/Respect1155.sol/Respect1155.json";

export default buildModule("Ordao", (m) => {
  const { orec } = m.useModule(OrecModule)

  const uri = m.getParameter("uri");

  const newRespect = m.contract("newRespect", Respect1155, [
    orec,
    uri
  ]);

  return { orec, newRespect };
});