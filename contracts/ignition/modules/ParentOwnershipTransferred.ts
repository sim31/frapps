import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ParentRespect from "./ParentRespect";

export default buildModule("ParentOwnershipTransferred", (m) => {
  const { parentRespect } = m.useModule(ParentRespect);
  const newOwner = m.getParameter("newOwner");

  m.call(parentRespect, "transferOwnership", [newOwner]);

  return { parentRespect };
});