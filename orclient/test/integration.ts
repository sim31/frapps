import chai, { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import ORClient, { BreakoutResult, ORNode, EthAddress } from "../src/orclient.js";
import hre, { run } from "hardhat";
import { ZeroAddress, hexlify, Signer } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers.js";
import { Orec__factory as OrecFactory } from "orec/typechain-types/factories/contracts/Orec__factory.js";
import { Orec } from "orec/typechain-types/contracts/Orec.js";
import FRF from "op-fractal-sc/typechain-types/factories/contracts/FractalRespect__factory.js";
const { FractalRespect__factory: FrRespectFactory } = FRF;
import { FractalRespect } from "op-fractal-sc/typechain-types/contracts/FractalRespect.js";
import RF from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
const { Respect1155__factory: RespectFactory } = RF;
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";

const MIN_1 = 60n;
const HOUR_1 = 60n * MIN_1;
const DAY_1 = 24n * HOUR_1;
const DAY_6 = 6n * DAY_1;
const WEEK_1 = 7n * DAY_1;

describe("orclient", function() {
  let cl: ORClient;
  const ethUrl = "https://localhost:8545";
  let ornode: ORNode;
  let addrs: EthAddress[] = []
  let oldRespect: FractalRespect;
  let newRespect: Respect1155;
  let orec: Orec;
  let signers: HardhatEthersSigner[];
  const oldRanksDelay = 518400; // 6 days in seconds

  const groupRes: BreakoutResult[] = [
    {
      groupNum: 1,
      rankings: [
        addrs[0], addrs[1], addrs[2], addrs[3], addrs[4], addrs[5]
      ]
    },
    {
      groupNum: 2,
      rankings: [
        addrs[6], addrs[7], addrs[8], addrs[9], addrs[10], ZeroAddress
      ]
    },
    {
      groupNum: 3,
      rankings: [
        addrs[12], addrs[13], addrs[14], addrs[15], addrs[16], ZeroAddress
      ]
    }
  ]

  before("launch eth test network", async function() {
    // TODO: set url
    console.log(hre.network);
  })
  
  before("create test accounts", async function() {
    console.log(await hre.ethers.getSigners())
    signers = await hre.ethers.getSigners();
    addrs = signers.map(signer => signer.address);
  });

  before("deploy old respect smart contract", async function() {
    const signer: HardhatEthersSigner = signers[0];
    const oldRespectFactory = new FrRespectFactory(signer);

    oldRespect = await oldRespectFactory.deploy(
      "TestFractal",
      "TF",
      signer,
      signer,
      oldRanksDelay
    );
  });

  before("run old fractal contract", async function() {
    const groupRes1: FractalRespect.GroupRanksStruct[] = [
      {
        groupNum: 1,
        ranks: [
          addrs[16], addrs[15], addrs[14], addrs[13], addrs[12], addrs[11]
        ]
      }
    ]
    await expect(oldRespect.submitRanks(groupRes1)).to.not.be.reverted;

    await time.increase(WEEK_1);

    const groupRes2: FractalRespect.GroupRanksStruct[] = [
      {
        groupNum: 1,
        ranks: [
          addrs[14], addrs[11], addrs[16], addrs[12], addrs[13], addrs[15]
        ]
      }
    ]
    await expect(oldRespect.submitRanks(groupRes2)).to.not.be.reverted;

    await time.increase(WEEK_1);

    const groupRes3: FractalRespect.GroupRanksStruct[] = [
      {
        groupNum: 1,
        ranks: [
          addrs[14], addrs[11], addrs[16], addrs[12], addrs[13], addrs[15]
        ]
      },
      {
        groupNum: 2,
        ranks: [
          addrs[1], addrs[2], addrs[3], addrs[4], addrs[5], addrs[6]
        ]
      }
    ]
    await expect(oldRespect.submitRanks(groupRes3)).to.not.be.reverted;

    await time.increase(WEEK_1);

    const groupRes4: FractalRespect.GroupRanksStruct[] = [
      {
        groupNum: 1,
        ranks: [
          addrs[6], addrs[2], addrs[3], addrs[1], addrs[4], addrs[5]
        ]
      },
      {
        groupNum: 2,
        ranks: [
          addrs[12], addrs[10], addrs[8], addrs[13], addrs[14], addrs[15]
        ]
      }
    ]
    await expect(oldRespect.submitRanks(groupRes4)).to.not.be.reverted;

  });

  before("deploy smart contracts", async function() {
    // TODO

    // const orecFactory = new OrecFactory(signer);
    // const respectFactory = new RespectFactory(signer);


  });

  before("create ORNode", async function() {
    ornode = {};
  })

  before("create ORClient", async function() {
    cl = await ORClient.createORClient({ ornode, eth: ethUrl });
  })

  describe("submitting breakout room results", function() {
    before("submit some results", async function() {

      await expect(cl.submitBreakoutResult(groupRes[0])).to.not.be.rejected;
      await expect(cl.submitBreakoutResult(groupRes[1])).to.not.be.rejected;
      await expect(cl.submitBreakoutResult(groupRes[2])).to.not.be.rejected;
      // TODO: submit with more different accounts
    })

    describe("lsProposals", function() {
      it("should return first submitted proposal as the last", async function() {
        const prop = (await cl.lsProposals())[2];



      })
      it("should return second submitted proposal as the second")
      it("should return third submitted proposal as the first")
    })
    it("should have created new proposals according to eth api")
    // TODO:
    it("should have created new proposals according to ornode")

  });
  describe("proposing to respect an individual account", function() {})
  describe("proposing to burn respect of an individual account", function() {})
  describe("proposing a tick (to increment meeting number)", function() {})
  describe("proposing a custom signal", function() {})
  describe("retrieving a list of proposals", function() {})
  describe("voting for existing proposal", function() {})
  describe("passing a proposal", function() {})
  describe("failing a proposal", function() {})
  describe("vetoing a proposal", function() {})
  describe("executing a passed proposal", function() {
    describe("respecting breakout group", function() {
      it("should execute successfully")
      it("should distribute appropriate amounts of respect to participants of a group");
    })
    describe("respecting individual account", function() {
      it("should mint a respect token of proposed value for the proposed account")
    })
    describe("burning respect of individual account", function() {
      it("should burn specified respect token")
    })
    describe("tick (incrementing period / meeting number)", function() {
      it("should increment nextMeetingNumber");
      it("should increment periodNumber")
      it("should increment lastMeetingNumber")
    })
    describe("custom signal", function() {
      it("should emit a Signal event with proposed data")
    })
  });
});