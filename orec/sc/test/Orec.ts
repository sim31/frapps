import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { AddressLike, BigNumberish, Signer, BytesLike, isBytesLike } from "ethers";
import { MintableToken, Orec } from "../typechain-types";

const MIN_1 = 60n;
const HOUR_1 = 60n * MIN_1;
const DAY_1 = 24n * HOUR_1;
const DAY_6 = 6n * DAY_1;

type PropId = BytesLike;
function isPropId(value: any): value is PropId {
  return isBytesLike(value);
}


function propId(msg: Orec.MessageStruct) {
  return ethers.solidityPackedKeccak256(
    [ "address", "bytes", "string" ],
    [msg.addr, msg.cdata, msg.memo]
  );
}

async function deployToken() {
  // Contracts are deployed using the first signer/account by default
  const [tokenOwner, otherAccount] = await hre.ethers.getSigners();

  const tokenFactory = await hre.ethers.getContractFactory("MintableToken");
  const token = await tokenFactory.deploy(tokenOwner, "TOKEN", "TOK");
  const tokenAddress = await token.getAddress();

  let mintNonce = 0;
  const buildMintProp = (recipient: AddressLike, amount: BigNumberish) => {
    const cdata = token.interface.encodeFunctionData("mint", [recipient, amount]);
    const msg: Orec.MessageStruct = {
      addr: tokenAddress,
      cdata,
      memo: `mint${mintNonce}`
    };
    mintNonce += 1;
    return { msg, id: propId(msg) }
  }

  let burnNonce = 0;
  const buildBurnProp = (recipient: AddressLike, amount: BigNumberish) => {
    const cdata = token.interface.encodeFunctionData("burn", [recipient, amount]);
    const msg: Orec.MessageStruct = {
      addr: tokenAddress,
      cdata,
      memo: `burn${burnNonce}`
    };
    burnNonce += 1;
    return { msg, id: propId(msg) };
  }

  return { token, tokenOwner, otherAccount, tokenAddress, buildMintProp, buildBurnProp };
}

async function deployOrec() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await hre.ethers.getSigners();

  const { token, tokenOwner, tokenAddress, buildMintProp, buildBurnProp } = await deployToken();

  const Orec = await hre.ethers.getContractFactory("Orec");
  const orec = await Orec.deploy(
    tokenAddress,
    DAY_1, DAY_6, 5
  );

  return { orec, token, tokenOwner, tokenAddress, buildMintProp, buildBurnProp };
}

async function deployOrecWithProposals() {
  const { orec, token, tokenOwner, tokenAddress, buildMintProp, buildBurnProp } = await loadFixture(deployOrec);

  const accounts = await hre.ethers.getSigners();

  const prop1 = buildMintProp(accounts[0].address, 5);
  await expect(orec.propose(prop1.id)).to.not.be.reverted;

  const prop2 = buildMintProp(accounts[1].address, 10);
  await expect(orec.propose(prop2.id)).to.not.be.reverted;

  await time.increase(60);

  const prop3 = buildMintProp(accounts[3].address, 12);
  await expect(orec.propose(prop3.id)).to.not.be.reverted;

  await time.increase(60);

  const prop4 = buildMintProp(accounts[3].address, 15);
  await expect(orec.propose(prop4.id)).to.not.be.reverted;

  const voteLen = await orec.voteLen();
  const vetoLen = await orec.vetoLen();
  const minWeight = await orec.minWeight();

  const nonce: BigNumberish = 4;

  return {
    orec, token, tokenOwner, tokenAddress, buildMintProp, accounts, nonce,
    voteLen, vetoLen, minWeight, buildBurnProp,
    proposals: [prop1, prop2, prop3, prop4]
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

  await expect(token.mint(accounts[7], 2)).to.not.be.reverted;
  await expect(token.mint(accounts[8], 2)).to.not.be.reverted;
  await expect(token.mint(accounts[9], 1)).to.not.be.reverted;
  await expect(token.mint(accounts[10], 5)).to.not.be.reverted;

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
    proposal: PropId | Orec.MessageStruct,
    voter: Signer,
    vtype: VoteType,
    memo: string = ""
  ): Promise<void> {
    const pid = isPropId(proposal) ? proposal : propId(proposal);
    const acc = orec.connect(voter);
    const expWeight = await token.balanceOf(voter);
    await expect(acc.vote(pid, vtype, memo)).to.not.be.reverted;
    const storedVote = await orec.votes(pid, voter);
    expect(storedVote.vtype).to.be.equal(vtype);
    expect(storedVote.weight).to.be.equal(expWeight);
  }

  async function expectVoteReverted(
    orec: Orec,
    token: MintableToken,
    proposal: PropId | Orec.MessageStruct,
    voter: Signer,
    vtype: VoteType,
    memo: string = ""
  ) {
    const pid = isPropId(proposal) ? proposal : propId(proposal);
    const acc = orec.connect(voter);
    await expect(acc.vote(pid, vtype, memo)).to.be.reverted;
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
      const { orec, token, tokenAddress, buildMintProp } = await loadFixture(deployOrec);
      const accounts = await hre.ethers.getSigners();

      // token.mint(accounts[2], 10).
      const prop = buildMintProp(accounts[2].address, 10);

      await expect(orec.propose(prop.id)).to.not.be.reverted;

      const storedProp = await orec.proposals(prop.id);

      expect(storedProp.yesWeight).to.equal(0);
      expect(storedProp.noWeight).to.equal(0);
      expect(storedProp.status).to.equal(0);
    });

    it("should store proposal with current block time as createTime", async function() {
      const { orec, buildMintProp } = await loadFixture(deployOrec);
      const accounts = await hre.ethers.getSigners();

      const prop = buildMintProp(accounts[3].address, 20);

      const txResp = await orec.propose(prop.id);
      const bl = await txResp.getBlock();
      
      const storedProp = await orec.proposals(prop.id);
      expect(storedProp.createTime).to.equal(bl?.timestamp);
    });

    it("should not proposing what already exist", async function() {
      const { orec, token, tokenAddress, buildMintProp } = await loadFixture(deployOrec);
      const accounts = await hre.ethers.getSigners();

      // token.mint(accounts[2], 10).
      const prop1 = buildMintProp(accounts[2].address, 10);
      await expect(orec.propose(prop1.id)).to.not.be.reverted;

      await expect(orec.propose(prop1.id)).to.be.reverted;

      const prop2 = buildMintProp(accounts[1].address, 1);
      await expect(orec.propose(prop2.id)).to.not.be.reverted;

      await expect(orec.propose(prop2.id)).to.be.reverted;
    });
  })

  describe("vote", function() {
    describe("voteTime (period: [createTime, createTime + voteLen))", function() {
      it("should allow voting yes during [createTime, createTime + voteLen) period", async function () {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposals);

        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.Yes);

        await time.increase(HOUR_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);

        await time.increase(22n * HOUR_1 + 55n * MIN_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.Yes);
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token, proposals: props} = await loadFixture(deployOrecWithProposals);

        await expectVoteReverted(orec, token, props[0].id, accounts[0], VoteType.None);

        await time.increase(HOUR_1);

        await expectVoteReverted(orec, token, props[0].id, accounts[1], VoteType.None);

        await time.increase(22n * HOUR_1 + 59n * MIN_1);

        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.None);
      })
      it("should increment yesWeight of proposal by the token balance of voter", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.Yes);
        let expYesWeight = await token.balanceOf(accounts[0]);
        let prop = await orec.proposals(props[0].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(0);

        await time.increase(HOUR_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);
        expYesWeight += await token.balanceOf(accounts[1]);
        prop = await orec.proposals(props[0].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(0);

        await time.increase(22n * HOUR_1 + 55n * MIN_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.Yes);
        expYesWeight += await token.balanceOf(accounts[2]);
        prop = await orec.proposals(props[0].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(0);
      });
      it("should allow voting no during [createTime, createTime+voteLen) period", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.No);

        await time.increase(HOUR_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.No);

        await time.increase(22n * HOUR_1 + 55n * MIN_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.No);
      })
      it("should increment noWeight of proposal by the token balance of a voter", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.No);
        let expNoWeight = await token.balanceOf(accounts[0]);
        let prop = await orec.proposals(props[0].id);
        expect(prop.yesWeight).to.be.equal(0);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        await time.increase(HOUR_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.No);
        expNoWeight += await token.balanceOf(accounts[1]);
        prop = await orec.proposals(props[0].id);
        expect(prop.yesWeight).to.be.equal(0);
        expect(prop.noWeight).to.be.equal(expNoWeight);
      });
      it("should allow switching from yes to no during [createTime, createTime+voteLen)", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.Yes);

        await time.increase(MIN_1);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.No);
      });
      it("should subtract from yesWeight and add to noWeight in case of a switched vote", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.Yes);
        let expYesWeight = await token.balanceOf(accounts[3]);
        let expNoWeight = 0n;
        let prop = await orec.proposals(props[1].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        await time.increase(MIN_1);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.No);
        expNoWeight = expYesWeight;
        expYesWeight = 0n;
        prop = await orec.proposals(props[1].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);
      })

      it("should not allow switching from no to yes", async function () {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.No);

        await time.increase(MIN_1);

        await expectVoteReverted(orec, token, props[1].id, accounts[3], VoteType.Yes);
      });

      it("should create a proposal if it does not exist yet", async function() {
        const { orec, accounts, token, voteLen, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalances);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        let storedProp = await orec.proposals(prop1.id);
        expect(await orec.proposalExists(prop1.id)).to.be.true;
        expect(storedProp.createTime).not.equal(0);
        expect(storedProp.yesWeight).to.equal(await token.balanceOf(accounts[6].address));
        expect(storedProp.status).to.be.equal(ExecStatus.NotExecuted);
        expect(storedProp.noWeight).to.be.equal(0);

        await time.increase(HOUR_1);
        
        // Check if others can vote on the new proposal as well
        await expectVoteCounted(orec, token, prop1.id, accounts[7], VoteType.Yes);
        storedProp = await orec.proposals(prop1.id);
        expect(await orec.proposalExists(prop1.id)).to.be.true;
        const newWeight =
          await token.balanceOf(accounts[6].address) + await token.balanceOf(accounts[7].address);
        expect(storedProp.yesWeight).to.equal(newWeight);
        expect(storedProp.status).to.be.equal(ExecStatus.NotExecuted);
        expect(storedProp.noWeight).to.be.equal(0);

        await time.increase(MIN_1);

        await expectVoteCounted(orec, token, prop1.id, accounts[8], VoteType.No);
        storedProp = await orec.proposals(prop1.id);
        expect(await orec.proposalExists(prop1.id)).to.be.true;
        expect(storedProp.yesWeight).to.equal(newWeight);
        expect(storedProp.status).to.be.equal(ExecStatus.NotExecuted);
        expect(storedProp.noWeight).to.be.equal(
          await token.balanceOf(accounts[8].address)
        );
      })
    });

    describe("vetoTime (period: [createTime + voteLen, createTime + voteLen + vetoLen)", function() {
      it("should not allow voting yes during [createTime+voteLen, createTime+voteLen+vetoLen) period", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        // Try during vote time first
        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.Yes);

        await time.increase(voteLen + 1n);

        await expectVoteReverted(orec, token, props[0].id, accounts[1], VoteType.Yes);

        await time.increase(MIN_1);

        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.Yes);
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await time.increase(voteLen + MIN_1);

        await expectVoteReverted(orec, token, props[0].id, accounts[1], VoteType.None);
      });

      it("should allow voting no during [createTime+voteLen, createTime+voteLen+vetoLen) period", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);

        await time.increase(voteLen);

        await expectVoteReverted(orec, token, props[0].id, accounts[1], VoteType.Yes);
        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.No);

        await time.increase(HOUR_1);
        await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.No);
      })

      it("should increment noWeight of proposal by respect of a voter, when voting no", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);

        await time.increase(voteLen + 1n);

        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.No);

        let expNoWeight = await token.balanceOf(accounts[1]);
        let expYesWeight = await token.balanceOf(accounts[6]);
        let prop = await orec.proposals(props[0].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        await time.increase(HOUR_1);
        await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.No);

        expNoWeight += await token.balanceOf(accounts[2]);
        prop = await orec.proposals(props[0].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);
      })
      it("should allow switching from yes to no during [createTime+voteLen, createTime+voteLen+vetoLen)", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);

        await time.increase(voteLen + 100n);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.No);
      });
      it("switching from yes to no should subtract from yesWeight and add to noWeight", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);

        let prop = await orec.proposals(props[0].id);
        const w = prop.yesWeight;

        await time.increase(voteLen + HOUR_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.No);

        prop = await orec.proposals(props[0].id);
        expect(prop.yesWeight).to.be.equal(0);
        expect(prop.noWeight).to.be.equal(w);
      });
      it("should not allow switching from no to yes", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.No);

        await time.increase(voteLen + HOUR_1);

        await expectVoteReverted(orec,token, props[0].id, accounts[2], VoteType.Yes);

        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.No);
        await time.increase(MIN_1);
        await expectVoteReverted(orec, token, props[0].id, accounts[0], VoteType.Yes);
      })
    });

    describe("executeTime (createTime+voteLen+vetoLen or later)", function() {
      it("should not allow voting yes", async function() {
        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].id, accounts[5], VoteType.No);
        await expectVoteCounted(orec, token, props[1].id, accounts[4], VoteType.Yes);

        await time.increase(voteLen + vetoLen + MIN_1);

        // Case when proposal is passed
        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.Yes);
        // Case when proposal is rejected with no
        await expectVoteReverted(orec, token, props[1].id, accounts[1], VoteType.Yes);
        // Case when proposal does not have any votes
        await expectVoteReverted(orec, token, props[2].id, accounts[3], VoteType.Yes);
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].id, accounts[5], VoteType.No);
        await expectVoteCounted(orec, token, props[1].id, accounts[4], VoteType.Yes);

        await time.increase(voteLen + vetoLen + MIN_1);

        // Case when proposal is passed
        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.None);
        // Case when proposal is rejected with no
        await expectVoteReverted(orec, token, props[1].id, accounts[1], VoteType.None);
        // Case when proposal does not have any votes
        await expectVoteReverted(orec, token, props[2].id, accounts[3], VoteType.None);

      })
      it("should not allow voting no", async function() {

        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].id, accounts[5], VoteType.No);
        await expectVoteCounted(orec, token, props[1].id, accounts[4], VoteType.Yes);

        await time.increase(voteLen + vetoLen + MIN_1);

        // Case when proposal is passed
        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.No);
        // Case when proposal is rejected with no
        await expectVoteReverted(orec, token, props[1].id, accounts[1], VoteType.No);
        // Case when proposal does not have any votes
        await expectVoteReverted(orec, token, props[2].id, accounts[3], VoteType.No);
      });
    })
  });

  describe("execute", function() {
    it("should not allow executing during voteTime [createTime, createTime + voteLen)", async function() {
      const { orec, accounts, token, voteLen, vetoLen, buildBurnProp } = await loadFixture(deployOrecWithProposalsAndBalances);

      const prop1 = buildBurnProp(accounts[1].address, 1);
      const prop2 = buildBurnProp(accounts[2].address, 1);

      await expectVoteCounted(orec, token, prop1.id, accounts[1], VoteType.Yes);
      await expectVoteCounted(orec, token, prop2.id, accounts[6], VoteType.Yes);

      await expect(orec.execute(prop1.msg)).to.be.reverted;
      await expect(orec.execute(prop2.msg)).to.be.reverted;
      await time.increase(HOUR_1 * 10n);
      await expect(orec.execute(prop1.msg)).to.be.reverted;
      await expect(orec.execute(prop2.msg)).to.be.reverted;

    })
    it("should not allow executing during vetoTime [createTime+voteLen, createTime+voteLen+vetoLen)", async function() {
      const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

      await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);
      await expectVoteCounted(orec, token, props[1].id, accounts[6], VoteType.Yes);

      await time.increase(DAY_1);
      await expect(orec.execute(props[0].msg)).to.be.reverted;
      await expect(orec.execute(props[1].msg)).to.be.reverted;

      await time.increase(HOUR_1 * 10n);
      await expect(orec.execute(props[0].msg)).to.be.reverted;
      await expect(orec.execute(props[1].msg)).to.be.reverted;

      await time.increase(HOUR_1 * 13n + MIN_1 * 59n);
      await expect(orec.execute(props[0].msg)).to.be.reverted;
      await expect(orec.execute(props[1].msg)).to.be.reverted;
    })

    describe("executeTime", function() {
      it("should not allow executing if noWeight * 2 > yesWeight", async function() {
        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        // Proposal 1: 8 Respect voting for, 5 - against. Proposal is rejected.
        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);
        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.No);

        // Proposal 2: 21 Respect voting for, 13 - against. Proposal is rejected.
        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.No);
        await expectVoteCounted(orec, token, props[1].id, accounts[2], VoteType.Yes);

        await time.increase(voteLen + vetoLen + MIN_1);
        
        await expect(orec.execute(props[0].msg)).to.be.reverted;
        await expect(orec.execute(props[1].msg)).to.be.reverted;
      });
      it("should not allow executing if noWeight * 2 == yesWeight", async function() {
        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        // Proposal 1: 8 Respect voting for, 4 - against. Proposal is rejected.
        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);
        await expectVoteCounted(orec, token, props[0].id, accounts[7], VoteType.No);
        await expectVoteCounted(orec, token, props[0].id, accounts[8], VoteType.No);

        // Proposal 2: 10 Respect voting for, 5 - against. Proposal is rejected.
        await expectVoteCounted(orec, token, props[1].id, accounts[0], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].id, accounts[7], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].id, accounts[8], VoteType.Yes);
        await time.increase(voteLen + MIN_1);
        await expectVoteCounted(orec, token, props[1].id, accounts[10], VoteType.No);

        await time.increase(vetoLen);
        
        await expect(orec.execute(props[0].msg)).to.be.reverted;
        await expect(orec.execute(props[1].msg)).to.be.reverted;
      });

      it("should not allow executing if yesWeight < minWeight", async function() {
        // minWeight is 5
        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        // Proposal 1: 2 Respect voting yes is not enough
        await expectVoteCounted(orec, token, props[0].id, accounts[7], VoteType.Yes);

        // Proposal 2: 4 Respect Voting yes is not enough even if it more than twice as much as yes votes (1)
        await expectVoteCounted(orec, token, props[1].id, accounts[7], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].id, accounts[8], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].id, accounts[9], VoteType.No);

        await time.increase(voteLen + vetoLen + 1n);

        await expect(orec.execute(props[0].msg)).to.be.reverted;
        await expect(orec.execute(props[1].msg)).to.be.reverted;
      });
      it("should allow executing (by anyone) if noWeight * 2 < yesWeight and noWeight > minWeight", async function() {
        // minWeight is 5
        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        // Proposal 1: 8 Respect voting yes. Proposal passes
        await expectVoteCounted(orec, token, props[0].msg, accounts[1], VoteType.Yes);

        // Proposal 2: 13 Respect Voting yes, 5 - voting no. Proposal passes
        await expectVoteCounted(orec, token, props[1].msg, accounts[2], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].msg, accounts[0], VoteType.No);

        await time.increase(voteLen + vetoLen + 1n);

        await expect(orec.execute(props[0].msg)).to.emit(orec, "Executed");
        expect((await orec.proposals(props[0].id)).status).to.be.equal(ExecStatus.Executed);
        await expect(orec.execute(props[1].msg)).to.emit(orec, "Executed");
        expect((await orec.proposals(props[1].id)).status).to.be.equal(ExecStatus.Executed);
        
      });
      it("should allow executing (by anyone) if noWeight * 2 < yesWeight and noWeight == minWeight", async function() {
        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        // Proposal 1: 5 Respect voting yes. Proposal passes
        await expectVoteCounted(orec, token, props[2].id, accounts[0], VoteType.Yes);

        // Proposal 2: 5 Respect Voting yes, 2 - voting no. Proposal passes
        await expectVoteCounted(orec, token, props[3].id, accounts[10], VoteType.Yes);
        await expectVoteCounted(orec, token, props[3].id, accounts[8], VoteType.No);

        await time.increase(voteLen + vetoLen + 1n);

        await expect(orec.execute(props[3].msg)).to.emit(orec, "Executed");
        expect((await orec.proposals(props[3].id)).status).to.be.equal(ExecStatus.Executed);
        await expect(orec.execute(props[2].msg)).to.emit(orec, "Executed");
        expect((await orec.proposals(props[2].id)).status).to.be.equal(ExecStatus.Executed);
      })
      it("should not allow executing if execution was already attempted and failed", async function() {
          const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

          // accounts[0] does not have that much to burn
          const prop = buildBurnProp(accounts[0].address, 1000000);

          await expectVoteCounted(orec, token, prop.id, accounts[0], VoteType.Yes);
          await expectVoteCounted(orec, token, prop.id, accounts[1], VoteType.Yes);
          await time.increase(voteLen + vetoLen);
          await expect(orec.execute(prop.msg)).to.emit(orec, "ExecutionFailed");
          expect((await orec.proposals(prop.id)).status).to.be.equal(ExecStatus.ExecutionFailed);

          await expect(orec.execute(prop.msg)).to.be.reverted;
      })
      it("should not allow executing if execution was already successful", async function() {
          const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

          await expectVoteCounted(orec,token, props[3].id, accounts[1], VoteType.Yes);
          await time.increase(voteLen + vetoLen);
          await expect(orec.execute(props[3].msg)).to.emit(orec, "Executed");
          expect((await orec.proposals(props[3].id)).status).to.be.equal(ExecStatus.Executed);

          await expect(orec.execute(props[3].msg)).to.be.reverted;
      })

      describe("executing messages to MintableToken", function() {
        it("should mint tokens", async function() {
          const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

          // 0th proposal is for issuing 5 to accounts[0]
          const initAcc0Balance = await token.balanceOf(accounts[0]);

          await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          await expect(orec.execute(props[0].msg)).to.emit(orec, "Executed");

          expect(await token.balanceOf(accounts[0])).to.be.equal(initAcc0Balance + 5n);
          expect((await orec.proposals(props[0].id)).status).to.be.equal(ExecStatus.Executed);
        });

        it("should burn tokens", async function() {
          const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

          // 0th proposal is for issuing 5 to accounts[0]
          const initAcc6Balance = await token.balanceOf(accounts[6]);

          const prop = buildBurnProp(accounts[6].address, 10);

          await expectVoteCounted(orec, token, prop.id, accounts[0], VoteType.Yes);
          await expectVoteCounted(orec, token, prop.id, accounts[1], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          await expect(orec.execute(prop.msg)).to.emit(orec, "Executed");

          expect(await token.balanceOf(accounts[6])).to.be.equal(initAcc6Balance - 10n);
          expect((await orec.proposals(prop.id)).status).to.be.equal(ExecStatus.Executed);
        });

        it("should emit ExecutionFailed in case of failed call", async function() {
          const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

          // accounts[0] does not have that much to burn
          const prop = buildBurnProp(accounts[0].address, 1000000);

          await expectVoteCounted(orec, token, prop.id, accounts[0], VoteType.Yes);
          await expectVoteCounted(orec, token, prop.id, accounts[1], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          await expect(orec.execute(prop.msg)).to.emit(orec, "ExecutionFailed");
        });
      })
    })
  });

  describe("Settings", function() {
    it("should allow itself to change voteLen", async function() {
      const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

      const cdata = orec.interface.encodeFunctionData("setVoteLen", [DAY_1 * 2n]);
      const msg: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: "setVoteLen1"
      };
      const pId = propId(msg);

      await expectVoteCounted(orec, token, pId, accounts[1], VoteType.Yes);

      await time.increase(voteLen + vetoLen);

      await expect(orec.execute(msg)).to.emit(orec, "Executed");

      expect(await orec.voteLen()).to.be.equal(DAY_1 * 2n);

      // Try voting later to test the new setting
      const msg2: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: "setVoteLen2"
      };
      const pId2 = propId(msg2);
      await expectVoteCounted(orec, token, pId2, accounts[1], VoteType.Yes);
      await time.increase(voteLen + HOUR_1 * 6n);
      await expectVoteCounted(orec, token, pId2, accounts[2], VoteType.Yes);
    });
    it("should allow changing vetoLen")
    it("should allow changing minWeight")
    it("should allow changing respect contract")
  });

  // TODO: remaining functions

});