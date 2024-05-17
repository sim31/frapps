import chai, { expect } from "chai";
import ORClient, { BreakoutResult, ORNode, EthAddress } from "../src/orclient";
import hre, { run } from "hardhat";
import { ZeroAddress, hexlify, Signer } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Orec__factory as OrecFactory } from "orec/typechain-types/factories/contracts/Orec__factory";
import { FractalRespect__factory as FrRespectFactory } from "op-fractal-sc/typechain-types/factories/contracts/FractalRespect__factory";

describe("orclient", function() {
  let cl: ORClient;
  const ethUrl = "https://localhost:8545";
  let ornode: ORNode;
  let addrs: EthAddress[] = []
  let oldRespect: EthAddress;
  let newRespect: EthAddress;
  let orecAddr: EthAddress;
  let signers: HardhatEthersSigner[];

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

  before("deploy smart contracts", async function() {
    // TODO

    const signer: Signer = signers[0];
    const orecFactory = new OrecFactory(signer);
    const oldRespectFactory = new FrRespectFactory(signer);


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