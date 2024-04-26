import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { AddressLike, BigNumberish, Signer } from "ethers";
import { MintableToken, Orec } from "../typechain-types";

async function deployToken() {
  // Contracts are deployed using the first signer/account by default
  const [tokenOwner, otherAccount] = await hre.ethers.getSigners();

  const tokenFactory = await hre.ethers.getContractFactory("MintableToken");
  const token = await tokenFactory.deploy(tokenOwner, "TOKEN", "TOK");
  const tokenAddress = await token.getAddress();

  const buildMintMsg = (recipient: AddressLike, amount: BigNumberish) => {
    const cdata = token.interface.encodeFunctionData("mint", [recipient, amount]);
    const msg: Orec.MessageStruct = {
      addr: tokenAddress,
      cdata
    };
    return msg;
  }

  const buildBurnMsg = (recipient: AddressLike, amount: BigNumberish) => {
    const cdata = token.interface.encodeFunctionData("burn", [recipient, amount]);
    const msg: Orec.MessageStruct = {
      addr: tokenAddress,
      cdata
    };
    return msg;
  }

  return { token, tokenOwner, otherAccount, tokenAddress, buildMintMsg, buildBurnMsg };
}

async function deployOrec() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await hre.ethers.getSigners();

  const { token, tokenOwner, tokenAddress, buildMintMsg } = await deployToken();

  const Orec = await hre.ethers.getContractFactory("Orec");
  const orec = await Orec.deploy(tokenAddress);

  return { orec, token, tokenOwner, tokenAddress, buildMintMsg };
}

async function deployOrecWithProposals() {
  const { orec, token, tokenOwner, tokenAddress, buildMintMsg } = await loadFixture(deployOrec);

  const accounts = await hre.ethers.getSigners();

  const msg = buildMintMsg(accounts[0].address, 5);
  await expect(orec.propose(msg)).to.not.be.reverted;

  const msg2 = buildMintMsg(accounts[1].address, 10);
  await expect(orec.propose(msg2)).to.not.be.reverted;

  await time.increase(60);

  const msg3 = buildMintMsg(accounts[3].address, 12);
  await expect(orec.propose(msg3)).to.not.be.reverted;

  await time.increase(60);

  const msg4 = buildMintMsg(accounts[3].address, 15);
  await expect(orec.propose(msg4)).to.not.be.reverted;

  return { orec, token, tokenOwner, tokenAddress, buildMintMsg, accounts };
}

async function deployOrecWithProposalsAndBalances() {
  const { orec, token, tokenOwner, tokenAddress, buildMintMsg, accounts } =
    await loadFixture(deployOrecWithProposals);

  await expect(token.mint(accounts[0], 5)).to.not.be.reverted;
  await expect(token.mint(accounts[1], 8)).to.not.be.reverted;
  await expect(token.mint(accounts[2], 13)).to.not.be.reverted;
  await expect(token.mint(accounts[3], 21)).to.not.be.reverted;
  await expect(token.mint(accounts[4], 34)).to.not.be.reverted;
  await expect(token.mint(accounts[5], 55)).to.not.be.reverted;
  await expect(token.mint(accounts[6], 89)).to.not.be.reverted;

  return { orec, token, tokenOwner, tokenAddress, buildMintMsg, accounts };
}

describe("Orec", function () {
  enum VoteType {
    None = 0,
    Yes = 1,
    No = 2
  }

  const MIN_1 = 60;
  const HOUR_1 = 60 * MIN_1;
  const DAY_1 = 24 * HOUR_1;
  const DAY_6 = 6 * DAY_1;

  async function expectVoteCounted(
    orec: Orec,
    token: MintableToken,
    propId: BigNumberish,
    voter: Signer,
    vtype: VoteType,
    memo: string = ""
  ) {
    const acc = orec.connect(voter);
    const expWeight = await token.balanceOf(voter);
    await expect(acc.vote(propId, vtype, memo)).to.not.be.reverted;
    const storedVote = await orec.votes(propId, voter);
    expect(storedVote.vtype).to.be.equal(vtype);
    expect(storedVote.weight).to.be.equal(expWeight);
  }

  async function expectVoteReverted(
    orec: Orec,
    token: MintableToken,
    propId: BigNumberish,
    voter: Signer,
    vtype: VoteType,
    memo: string = ""
  ) {
    const acc = orec.connect(voter);
    await expect(acc.vote(propId, vtype, memo)).to.be.reverted;
  }

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
      const { orec, token, tokenAddress, buildMintMsg } = await loadFixture(deployOrec);
      const accounts = await hre.ethers.getSigners();

      // token.mint(accounts[2], 10).
      const msg = buildMintMsg(accounts[2].address, 10);

      await expect(orec.propose(msg)).to.not.be.reverted;

      const storedProp = await orec.proposals(0);

      expect(storedProp.yesWeight).to.equal(0);
      expect(storedProp.noWeight).to.equal(0);
      expect(storedProp.message.cdata).to.equal(msg.cdata);
      expect(storedProp.message.addr).to.equal(msg.addr);
      expect(storedProp.status).to.equal(0);
    });

    it("should store proposal with current block time as createTime", async function() {
      const { orec, buildMintMsg } = await loadFixture(deployOrec);
      const accounts = await hre.ethers.getSigners();

      // token.mint(accounts[2], 10).
      const msg = buildMintMsg(accounts[3].address, 20);

      const txResp = await orec.propose(msg);
      const bl = await txResp.getBlock();
      
      const storedProp = await orec.proposals(0);
      expect(storedProp.createTime).to.equal(bl?.timestamp);
    });
  })

  describe("vote", function() {
    describe("voteTime (period: [createTime, createTime + voteLen))", function() {
      it("should allow voting yes during [createTime, createTime + voteLen) period", async function () {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposals);

        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.Yes);

        time.increase(HOUR_1);

        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.Yes);

        time.increase(22 * HOUR_1 + 55 * MIN_1);

        await expectVoteCounted(orec, token, 0, accounts[2], VoteType.Yes);
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposals);

        await expectVoteReverted(orec, token, 0, accounts[0], VoteType.None);

        time.increase(HOUR_1);

        await expectVoteReverted(orec, token, 0, accounts[1], VoteType.None);

        time.increase(22 * HOUR_1 + 59 * MIN_1);

        await expectVoteReverted(orec, token, 0, accounts[2], VoteType.None);
      })
      it("should increment yesWeight of proposal by the token balance of voter", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.Yes);
        let expYesWeight = await token.balanceOf(accounts[0]);
        let prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(0);

        time.increase(HOUR_1);

        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.Yes);
        expYesWeight += await token.balanceOf(accounts[1]);
        prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(0);

        time.increase(22 * HOUR_1 + 55 * MIN_1);

        await expectVoteCounted(orec, token, 0, accounts[2], VoteType.Yes);
        expYesWeight += await token.balanceOf(accounts[2]);
        prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(0);
      });
      it("should allow voting no during [createTime, createTime+voteLen) period", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.No);

        time.increase(HOUR_1);

        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.No);

        time.increase(22 * HOUR_1 + 55 * MIN_1);

        await expectVoteCounted(orec, token, 0, accounts[2], VoteType.No);
      })
      it("should increment noWeight of proposal by the token balance of a voter", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.No);
        let expNoWeight = await token.balanceOf(accounts[0]);
        let prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(0);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        time.increase(HOUR_1);

        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.No);
        expNoWeight += await token.balanceOf(accounts[1]);
        prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(0);
        expect(prop.noWeight).to.be.equal(expNoWeight);
      });
      it("should allow switching from yes to no during [createTime, createTime+voteLen)", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 1, accounts[3], VoteType.Yes);

        time.increase(MIN_1);

        await expectVoteCounted(orec, token, 1, accounts[3], VoteType.No);
      });
      it("should subtract from yesWeight and add to noWeight in case of a switched vote", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 1, accounts[3], VoteType.Yes);
        let expYesWeight = await token.balanceOf(accounts[3]);
        let expNoWeight = 0n;
        let prop = await orec.proposals(1);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        time.increase(MIN_1);

        await expectVoteCounted(orec, token, 1, accounts[3], VoteType.No);
        expNoWeight = expYesWeight;
        expYesWeight = 0n;
        prop = await orec.proposals(1);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);
      })

      it("should not allow switching from no to yes", async function () {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 1, accounts[3], VoteType.No);

        time.increase(MIN_1);

        await expectVoteReverted(orec, token, 1, accounts[3], VoteType.Yes);
      });
    });

    describe("vetoTime (period: [createTime + voteLen, createTime + voteLen + vetoLen)", function() {
      it("should not allow voting yes during [createTime+voteLen, createTime+voteLen+vetoLen) period", async function() {

      });
      it("should not allow voting with none vtype")
      it("should allow voting no during [createTime+voteLen, createTime+voteLen+vetoLen) period")
      it("should increment noWeight of proposal by the token balance of a voter")
      it("should allow switching from yes to no during [createTime+voteLen, createTime+voteLen+vetoLen)")
      it("switching from yes to no should subtract from yesWeight and add to noWeight")
      it("should not allow switching from no to yes")
    });

    describe("executeTime (createTime+voteLen+vetoLen or later)", function() {
      it("should not allow voting yes");
      it("should not allow voting with none vtype")
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