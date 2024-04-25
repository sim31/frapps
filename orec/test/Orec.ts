import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

async function deployToken() {
  // Contracts are deployed using the first signer/account by default
  const [tokenOwner, otherAccount] = await hre.ethers.getSigners();

  const tokenFactory = await hre.ethers.getContractFactory("MintableToken");
  const token = await tokenFactory.deploy(tokenOwner, "TOKEN", "TOK");
  const tokenAddress = await token.getAddress();

  return { token, tokenOwner, otherAccount, tokenAddress };
}

async function deployOrec() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await hre.ethers.getSigners();

  const { token, tokenOwner, tokenAddress } = await deployToken();

  const Orec = await hre.ethers.getContractFactory("Orec");
  const orec = await Orec.deploy(tokenAddress);

  return { orec, token, tokenOwner, tokenAddress };
}

describe("Orec", function () {
  describe("Deployment", function () {
    it("Should set respectContract", async function () {
      const { orec, token, tokenAddress } = await loadFixture(deployOrec);

      expect(await orec.respectContract()).to.equal(tokenAddress);
    });
  });
  // function propose(Message calldata message) public {
  // function vote(uint256 propId, VoteType voteType, string calldata memo) public {
  // function execute(uint256 propId) public returns (bool) {
  // function remove(uint256 propId) public {

  describe("propose", function() {
    it("should store a proposal with initial values", async function() {
      const { orec, token, tokenAddress } = await loadFixture(deployOrec);
      const accounts = await hre.ethers.getSigners();

      // token.mint(accounts[2], 10).
      const cdata = token.interface.encodeFunctionData("mint", [accounts[2].address, 10]);

      const message = {
        cdata,
        addr: tokenAddress
      }

      await expect(orec.propose(message)).to.not.be.reverted;

      const storedProp = await orec.proposals(0);

      expect(storedProp.yesWeight).to.equal(0);
      expect(storedProp.noWeight).to.equal(0);
      expect(storedProp.message.cdata).to.equal(message.cdata);
      expect(storedProp.message.addr).to.equal(message.addr);
      expect(storedProp.status).to.equal(0);
    });

    it("should store proposal with current block time as createTime", async function() {
      const { orec, token, tokenAddress } = await loadFixture(deployOrec);
      const accounts = await hre.ethers.getSigners();

      // token.mint(accounts[2], 10).
      const cdata = token.interface.encodeFunctionData("mint", [accounts[3].address, 20]);

      const message = {
        cdata,
        addr: tokenAddress
      }

      const txResp = await orec.propose(message);
      const bl = await txResp.getBlock();
      
      const storedProp = await orec.proposals(0);
      expect(storedProp.createTime).to.equal(bl?.timestamp);
    });
  })

  describe("vote", function() {
    describe("voteTime (period: [createTime, createTime + voteLen))", function() {
      it("should allow voting yes during [createTime, createTime + voteLen) period");
      it("should increment yesWeight of proposal by the token balance of voter")
      it("should allow voting no during [createTime, createTime+voteLen) period")
      it("should increment noWeight of proposal by the token balance of a voter")
      it("should allow switching from yes to no during [createTime, createTime+voteLen)")
      it("switching from yes to no should subtract from yesWeight and add to noWeight")
      it("should not allow switching from no to yes")
    });

    describe("vetoTime (period: [createTime + voteLen, createTime + voteLen + vetoLen)", function() {
      it("should not allow voting yes during [createTime+voteLen, createTime+voteLen+vetoLen) period");
      it("should allow voting no during [createTime+voteLen, createTime+voteLen+vetoLen) period")
      it("should increment noWeight of proposal by the token balance of a voter")
      it("should allow switching from yes to no during [createTime+voteLen, createTime+voteLen+vetoLen)")
      it("switching from yes to no should subtract from yesWeight and add to noWeight")
      it("should not allow switching from no to yes")
    });

    describe("executeTime (createTime+voteLen+vetoLen or later)", function() {
      it("should not allow voting yes");
      it("should not allow voting no")
    })
  });

  describe("execute", function() {
    it("should not allow executing during voteTime [createTime, createTime + voteLen)")
    it("should not allow executing during vetoTime [createTime+voteLen, createTime+voteLen+vetLen)")

    describe("executeTime", function() {
      it("should not allow executing if noWeight * 2 >= yesWeight")
      it("should allow executing (by anyone) if noWeight * 2 < yesWeight")
      it("should not allow executing if execution was already attempted and failed")
      it("should not allow executing if execution was already successful")

      describe("executing messages to MintableToken", function() {
        it("should mint tokens")
        it("should burn tokens")
      })
    })
  });

  // TODO: remaining functions

});