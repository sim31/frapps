import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";

// This is for dev environment, so parameters are hardcoded

export default buildModule("ParentFractalRespect", (m) => {
  const parentRespect = m.contract(
    "FractalRespect",
    [
      "FractalRespect", // name
      "FR",             // symbol
      m.getAccount(0), // issuer
      m.getAccount(0), // executor
      0                // ranks delay
    ]
  )

  m.call(parentRespect, "submitRanks", [[
    {
      groupNum: 1,
      ranks: [
        m.getAccount(16),
        m.getAccount(15),
        m.getAccount(14),
        m.getAccount(13),
        m.getAccount(12),
        m.getAccount(11)
      ]
    }
  ]], { id: "submitRanks1" })
  m.call(parentRespect, "submitRanks", [[
    {
      groupNum: 1,
      ranks: [
        m.getAccount(14),
        m.getAccount(11),
        m.getAccount(16),
        m.getAccount(12),
        m.getAccount(13),
        m.getAccount(15)
      ]
    }
  ]], { id: "submitRanks2" })
  m.call(parentRespect, "submitRanks", [[
    {
      groupNum: 1,
      ranks: [
        m.getAccount(7),
        m.getAccount(11),
        m.getAccount(16),
        m.getAccount(12),
        m.getAccount(13),
        m.getAccount(14)
      ]
    },
    {
      groupNum: 2,
      ranks: [
        m.getAccount(1),
        m.getAccount(2),
        m.getAccount(3),
        m.getAccount(4),
        m.getAccount(5),
        m.getAccount(6)
      ]
    }
  ]], { id: "submitRanks3" });
  m.call(parentRespect, "submitRanks", [[
    {
      groupNum: 1,
      ranks: [
        m.getAccount(6),
        m.getAccount(2),
        m.getAccount(3),
        m.getAccount(1),
        m.getAccount(4),
        m.getAccount(5)
      ]
    },
    {
      groupNum: 2,
      ranks: [
        m.getAccount(12),
        m.getAccount(10),
        m.getAccount(8),
        m.getAccount(13),
        m.getAccount(14),
        m.getAccount(15)
      ]
    }
  ]], { id: "submitRanks4" });

  return { parentRespect };
});