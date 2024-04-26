import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { AddressLike, BigNumberish, Signer } from "ethers";
import { MintableToken, Orec } from "../typechain-types";

const MIN_1 = 60n;
const HOUR_1 = 60n * MIN_1;
const DAY_1 = 24n * HOUR_1;
const DAY_6 = 6n * DAY_1;

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

  const { token, tokenOwner, tokenAddress, buildMintMsg, buildBurnMsg } = await deployToken();

  const Orec = await hre.ethers.getContractFactory("Orec");
  const orec = await Orec.deploy(
    tokenAddress,
    DAY_1, DAY_6, 5
  );

  return { orec, token, tokenOwner, tokenAddress, buildMintMsg, buildBurnMsg };
}

async function deployOrecWithProposals() {
  const { orec, token, tokenOwner, tokenAddress, buildMintMsg, buildBurnMsg } = await loadFixture(deployOrec);

  const accounts = await hre.ethers.getSigners();

  const msg = buildMintMsg(accounts[0].address, 5);
  await expect(orec.propose(msg, 0)).to.not.be.reverted;

  const msg2 = buildMintMsg(accounts[1].address, 10);
  await expect(orec.propose(msg2, 1)).to.not.be.reverted;

  await time.increase(60);

  const msg3 = buildMintMsg(accounts[3].address, 12);
  await expect(orec.propose(msg3, 2)).to.not.be.reverted;

  await time.increase(60);

  const msg4 = buildMintMsg(accounts[3].address, 15);
  await expect(orec.propose(msg4, 3)).to.not.be.reverted;

  const voteLen = await orec.voteLen();
  const vetoLen = await orec.vetoLen();
  const minWeight = await orec.minWeight();

  const nonce: BigNumberish = 4;

  return {
    orec, token, tokenOwner, tokenAddress, buildMintMsg, accounts, nonce,
    voteLen, vetoLen, minWeight, buildBurnMsg
   };
}

async function deployOrecWithProposalsAndBalances() {
  const vars = await loadFixture(deployOrecWithProposals);
  const { token, accounts, orec } = vars;

  await expect(token.mint(accounts[0], 5)).to.not.be.reverted;
  await expect(token.mint(accounts[1], 8)).to.not.be.reverted;
  await expect(token.mint(accounts[2], 13)).to.not.be.reverted;
  await expect(token.mint(accounts[3], 21)).to.not.be.reverted;
  await expect(token.mint(accounts[4], 34)).to.not.be.reverted;
  await expect(token.mint(accounts[5], 55)).to.not.be.reverted;
  await expect(token.mint(accounts[6], 89)).to.not.be.reverted;

  // At this point let orec do further mints and burns
  await token.transferOwnership(orec);

  return vars;
}

describe("Orec", function () {
  enum VoteType {
    None = 0,
    Yes = 1,
    No = 2
  }

  enum ExecStatus {
    NotExecuted = 0,
    Executed,
    ExecutionFailed
  }

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

    it("should set itself as the owner", async function() {
      const { orec, token, tokenAddress } = await loadFixture(deployOrec);

      expect(await orec.owner()).to.be.equal(await orec.getAddress())
    });

    it("should set voteLen, vetoLen and minWeight", async function() {
      const { orec, token, tokenAddress } = await loadFixture(deployOrec);

      expect(await orec.voteLen()).to.be.equal(DAY_1);
      expect(await orec.vetoLen()).to.be.equal(DAY_6);
      expect(await orec.minWeight()).to.be.equal(5);
    })
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

      await expect(orec.propose(msg, 0)).to.not.be.reverted;

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

      const msg = buildMintMsg(accounts[3].address, 20);

      const txResp = await orec.propose(msg, 0);
      const bl = await txResp.getBlock();
      
      const storedProp = await orec.proposals(0);
      expect(storedProp.createTime).to.equal(bl?.timestamp);
    });

    it("should not allow reusing a nonce", async function() {
      const { orec, token, tokenAddress, buildMintMsg } = await loadFixture(deployOrec);
      const accounts = await hre.ethers.getSigners();

      // token.mint(accounts[2], 10).
      const msg1 = buildMintMsg(accounts[2].address, 10);
      await expect(orec.propose(msg1, 0)).to.not.be.reverted;

      await expect(orec.propose(msg1, 0)).to.be.reverted;

      const msg2 = buildMintMsg(accounts[1].address, 1);
      await expect(orec.propose(msg1, 1)).to.not.be.reverted;

      const msg3 = buildMintMsg(accounts[0].address, 1);
      await expect(orec.propose(msg3, 1)).to.be.reverted;
    });
  })

  describe("vote", function() {
    describe("voteTime (period: [createTime, createTime + voteLen))", function() {
      it("should allow voting yes during [createTime, createTime + voteLen) period", async function () {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposals);

        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.Yes);

        await time.increase(HOUR_1);

        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.Yes);

        await time.increase(22n * HOUR_1 + 55n * MIN_1);

        await expectVoteCounted(orec, token, 0, accounts[2], VoteType.Yes);
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposals);

        await expectVoteReverted(orec, token, 0, accounts[0], VoteType.None);

        await time.increase(HOUR_1);

        await expectVoteReverted(orec, token, 0, accounts[1], VoteType.None);

        await time.increase(22n * HOUR_1 + 59n * MIN_1);

        await expectVoteReverted(orec, token, 0, accounts[2], VoteType.None);
      })
      it("should increment yesWeight of proposal by the token balance of voter", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.Yes);
        let expYesWeight = await token.balanceOf(accounts[0]);
        let prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(0);

        await time.increase(HOUR_1);

        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.Yes);
        expYesWeight += await token.balanceOf(accounts[1]);
        prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(0);

        await time.increase(22n * HOUR_1 + 55n * MIN_1);

        await expectVoteCounted(orec, token, 0, accounts[2], VoteType.Yes);
        expYesWeight += await token.balanceOf(accounts[2]);
        prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(0);
      });
      it("should allow voting no during [createTime, createTime+voteLen) period", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.No);

        await time.increase(HOUR_1);

        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.No);

        await time.increase(22n * HOUR_1 + 55n * MIN_1);

        await expectVoteCounted(orec, token, 0, accounts[2], VoteType.No);
      })
      it("should increment noWeight of proposal by the token balance of a voter", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.No);
        let expNoWeight = await token.balanceOf(accounts[0]);
        let prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(0);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        await time.increase(HOUR_1);

        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.No);
        expNoWeight += await token.balanceOf(accounts[1]);
        prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(0);
        expect(prop.noWeight).to.be.equal(expNoWeight);
      });
      it("should allow switching from yes to no during [createTime, createTime+voteLen)", async function() {
        const { orec, accounts, token } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 1, accounts[3], VoteType.Yes);

        await time.increase(MIN_1);

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

        await time.increase(MIN_1);

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

        await time.increase(MIN_1);

        await expectVoteReverted(orec, token, 1, accounts[3], VoteType.Yes);
      });
    });

    describe("vetoTime (period: [createTime + voteLen, createTime + voteLen + vetoLen)", function() {
      it("should not allow voting yes during [createTime+voteLen, createTime+voteLen+vetoLen) period", async function() {
        const { orec, accounts, token, voteLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        // Try during vote time first
        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.Yes);

        await time.increase(voteLen + 1n);

        await expectVoteReverted(orec, token, 0, accounts[1], VoteType.Yes);

        await time.increase(MIN_1);

        await expectVoteReverted(orec, token, 0, accounts[2], VoteType.Yes);
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token, voteLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        await time.increase(voteLen + MIN_1);

        await expectVoteReverted(orec, token, 0, accounts[1], VoteType.None);
      });

      it("should allow voting no during [createTime+voteLen, createTime+voteLen+vetoLen) period", async function() {
        const { orec, accounts, token, voteLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.Yes);

        await time.increase(voteLen);

        await expectVoteReverted(orec, token, 0, accounts[1], VoteType.Yes);
        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.No);

        await time.increase(HOUR_1);
        await expectVoteCounted(orec, token, 0, accounts[2], VoteType.No);
      })
      it("should increment noWeight of proposal by respect of a voter, when voting no", async function() {
        const { orec, accounts, token, voteLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.Yes);

        await time.increase(voteLen + 1n);

        await expectVoteCounted(orec, token, 0, accounts[1], VoteType.No);

        let expNoWeight = await token.balanceOf(accounts[1]);
        let expYesWeight = await token.balanceOf(accounts[6]);
        let prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        await time.increase(HOUR_1);
        await expectVoteCounted(orec, token, 0, accounts[2], VoteType.No);

        expNoWeight += await token.balanceOf(accounts[2]);
        prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);
      })
      it("should allow switching from yes to no during [createTime+voteLen, createTime+voteLen+vetoLen)", async function() {
        const { orec, accounts, token, voteLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.Yes);

        await time.increase(voteLen + 100n);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.No);
      });
      it("switching from yes to no should subtract from yesWeight and add to noWeight", async function() {
        const { orec, accounts, token, voteLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.Yes);

        let prop = await orec.proposals(0);
        const w = prop.yesWeight;

        await time.increase(voteLen + HOUR_1);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.No);

        prop = await orec.proposals(0);
        expect(prop.yesWeight).to.be.equal(0);
        expect(prop.noWeight).to.be.equal(w);
      });
      it("should not allow switching from no to yes", async function() {
        const { orec, accounts, token, voteLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, 0, accounts[2], VoteType.No);

        await time.increase(voteLen + HOUR_1);

        await expectVoteReverted(orec,token, 0, accounts[2], VoteType.Yes);

        await expectVoteCounted(orec, token, 0, accounts[0], VoteType.No);
        await time.increase(MIN_1);
        await expectVoteReverted(orec, token, 0, accounts[0], VoteType.Yes);
      })
    });

    describe("executeTime (createTime+voteLen+vetoLen or later)", function() {
      it("should not allow voting yes", async function() {
        const { orec, accounts, token, voteLen, vetoLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, 1, accounts[5], VoteType.No);
        await expectVoteCounted(orec, token, 1, accounts[4], VoteType.Yes);

        await time.increase(voteLen + vetoLen + MIN_1);

        // Case when proposal is passed
        await expectVoteReverted(orec, token, 0, accounts[2], VoteType.Yes);
        // Case when proposal is rejected with no
        await expectVoteReverted(orec, token, 1, accounts[1], VoteType.Yes);
        // Case when proposal does not have any votes
        await expectVoteReverted(orec, token, 2, accounts[3], VoteType.Yes);
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token, voteLen, vetoLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, 1, accounts[5], VoteType.No);
        await expectVoteCounted(orec, token, 1, accounts[4], VoteType.Yes);

        await time.increase(voteLen + vetoLen + MIN_1);

        // Case when proposal is passed
        await expectVoteReverted(orec, token, 0, accounts[2], VoteType.None);
        // Case when proposal is rejected with no
        await expectVoteReverted(orec, token, 1, accounts[1], VoteType.None);
        // Case when proposal does not have any votes
        await expectVoteReverted(orec, token, 2, accounts[3], VoteType.None);

      })
      it("should not allow voting no", async function() {

        const { orec, accounts, token, voteLen, vetoLen } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, 0, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, 1, accounts[5], VoteType.No);
        await expectVoteCounted(orec, token, 1, accounts[4], VoteType.Yes);

        await time.increase(voteLen + vetoLen + MIN_1);

        // Case when proposal is passed
        await expectVoteReverted(orec, token, 0, accounts[2], VoteType.No);
        // Case when proposal is rejected with no
        await expectVoteReverted(orec, token, 1, accounts[1], VoteType.No);
        // Case when proposal does not have any votes
        await expectVoteReverted(orec, token, 2, accounts[3], VoteType.No);
      });
    })
  });

  describe("proposeAndVote", function() {
    it("should create a proposal and record a yes vote", async function() {
      const { orec, token, tokenAddress, buildMintMsg } = await loadFixture(deployOrec);
      const accounts = await hre.ethers.getSigners();

      // token.mint(accounts[2], 10).
      const msg = buildMintMsg(accounts[2].address, 10);

      const txResp = await orec.proposeAndVote(msg, 0, VoteType.Yes, "");
      const bl = await txResp.getBlock();

      const weight = await token.balanceOf(accounts[0]);

      const storedProp = await orec.proposals(0);

      expect(storedProp.yesWeight).to.equal(weight);
      expect(storedProp.noWeight).to.equal(0);
      expect(storedProp.message.cdata).to.equal(msg.cdata);
      expect(storedProp.message.addr).to.equal(msg.addr);
      expect(storedProp.status).to.equal(0);
      expect(storedProp.createTime).to.equal(bl?.timestamp);

      const storedVote = await orec.votes(0, accounts[0]);
      expect(storedVote.vtype).to.be.equal(VoteType.Yes);
      expect(storedVote.weight).to.be.equal(weight);
    });
  })

  describe("execute", function() {
    it("should not allow executing during voteTime [createTime, createTime + voteLen)")
    it("should not allow executing during vetoTime [createTime+voteLen, createTime+voteLen+vetoLen)")

    describe("executeTime", function() {
      it("should not allow executing if noWeight * 2 >= yesWeight")
      it("should not allow executing if noWeight < minWeight")
      it("should allow executing (by anyone) if noWeight * 2 < yesWeight and noWeight >= minWeight")
      it("should not allow executing if execution was already attempted and failed")
      it("should not allow executing if execution was already successful")

      describe("executing messages to MintableToken", function() {
        it("should mint tokens", async function() {
          const { orec, accounts, token, voteLen, vetoLen } = await loadFixture(deployOrecWithProposalsAndBalances);

          // 0th proposal is for issuing 5 to accounts[0]
          const initAcc0Balance = await token.balanceOf(accounts[0]);

          await expectVoteCounted(orec, token, 0, accounts[1], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          await expect(orec.execute(0)).to.emit(orec, "Executed");

          expect(await token.balanceOf(accounts[0])).to.be.equal(initAcc0Balance + 5n);
          expect((await orec.proposals(0)).status).to.be.equal(ExecStatus.Executed);
        });

        it("should burn tokens", async function() {
          const { orec, accounts, token, voteLen, vetoLen, buildBurnMsg, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

          // 0th proposal is for issuing 5 to accounts[0]
          const initAcc6Balance = await token.balanceOf(accounts[6]);

          const msg = buildBurnMsg(accounts[6].address, 10);

          await expect(orec.proposeAndVote(msg, nonce, VoteType.Yes, "")).to.not.be.reverted;
          await expectVoteCounted(orec, token, 0, accounts[1], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          await expect(orec.execute(nonce)).to.emit(orec, "Executed");

          expect(await token.balanceOf(accounts[6])).to.be.equal(initAcc6Balance - 10n);
          expect((await orec.proposals(nonce)).status).to.be.equal(ExecStatus.Executed);
        });

        it("should emit ExecutionFailed in case of failed call", async function() {
          const { orec, accounts, token, voteLen, vetoLen, buildBurnMsg, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

          // accounts[0] does not have that much to burn
          const msg = buildBurnMsg(accounts[0].address, 1000000);

          await expect(orec.proposeAndVote(msg, nonce, VoteType.Yes, "")).to.not.be.reverted;
          await expectVoteCounted(orec, token, 0, accounts[1], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          await expect(orec.execute(nonce)).to.emit(orec, "ExecutionFailed");
        });
      })
    })
  });

  describe("Settings", function() {
    it("should allow itself to change voteLen", async function() {
      const { orec, accounts, token, voteLen, vetoLen, buildBurnMsg, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

      const cdata = orec.interface.encodeFunctionData("setVoteLen", [DAY_1 * 2n]);
      const msg: Orec.MessageStruct = {
        addr: orec,
        cdata
      };

      await expect(orec.proposeAndVote(msg, nonce, VoteType.Yes, "")).to.not.be.reverted;

      await time.increase(voteLen + vetoLen);

      await expect(orec.execute(nonce)).to.emit(orec, "Executed");

      expect(await orec.voteLen()).to.be.equal(DAY_1 * 2n);

      // Try voting later to test the new setting
      await expect(orec.proposeAndVote(msg, nonce+1, VoteType.Yes, "")).to.not.be.reverted;
      await time.increase(voteLen + HOUR_1 * 6n);
      await expectVoteCounted(orec, token, nonce+1, accounts[1], VoteType.Yes);
    });
    it("should allow changing vetoLen")
    it("should allow changing minWeight")
    it("should allow changing respect contract")
  });

  // TODO: remaining functions

});