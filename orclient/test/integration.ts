import { expect } from "chai";
import ORClient, { BreakoutResult, ORNode, EthAddress } from "../src/orclient";
import hre from "hardhat";
import { ZeroAddress, hexlify } from "ethers";


describe("orclient", function() {
  let cl: ORClient;
  const ethUrl = "https://localhost:1000";
  let ornode: ORNode;
  let addrs: EthAddress[] = []

  before("launch eth test network", async function() {
    console.log(hre.network);
  })
  
  before("create test accounts", async function() {
    console.log(hre.ethers.getSigners())
    const signers = await hre.ethers.getSigners();
    addrs = signers.map(signer => signer.address);
  })

  before("create ORNode", async function() {
    ornode = {};
  })

  before("create ORClient", async function() {
    cl = await ORClient.createORClient({ ornode, eth: ethUrl });
  })

  describe("submitting breakout room results", function() {
    before("submit some results", async function() {
      const group1: BreakoutResult = {
        groupNum: 1,
        rankings: [
          addrs[0], addrs[1], addrs[2], addrs[3], addrs[4], addrs[5]
        ]
      };
      const group2: BreakoutResult = {
        groupNum: 2,
        rankings: [
          addrs[6], addrs[7], addrs[8], addrs[9], addrs[10], ZeroAddress
        ]
      };
      const group3: BreakoutResult = {
        groupNum: 3,
        rankings: [
          addrs[12], addrs[13], addrs[14], addrs[15], addrs[16], ZeroAddress
        ]
      };

      await expect(cl.submitBreakoutResult(group1)).to.not.be.rejected;
      await expect(cl.submitBreakoutResult(group2)).to.not.be.rejected;
      await expect(cl.submitBreakoutResult(group3)).to.not.be.rejected;
      // TODO: submit with more different accounts
    })

    it("should create new proposals according to ornode")
    it("should create new proposals according to eth api")

  });
  describe("proposing to respect an individual account")
  describe("proposing to burn respect of an individual account")
  describe("proposing a tick (to increment meeting number)")
  describe("proposing a custom signal")
  describe("retrieving a list of proposals")
  describe("voting for existing proposal")
  describe("passing a proposal")
  describe("failing a proposal")
  describe("vetoing a proposal")
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