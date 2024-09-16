import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { 
  AddressLike,
  BigNumberish,
  Signer, BytesLike,
  isBytesLike,
  toUtf8Bytes, hexlify
} from "ethers";
import { MintableRespectToken, MintableToken, Orec } from "../typechain-types/index.js";
import {
  isPropId, propId, PropId,
  MIN_1, DAY_1, HOUR_1, DAY_6,
  ExecStatus, VoteType,
  Stage, VoteStatus
} from "../utils";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

const MAX_LIVE_VOTES = 4;

type TokenType = "MintableToken" | "MintableRespectToken";

let irespectId: string;

async function deployToken(
  symbol: string = "TOK",
  contract: TokenType = "MintableToken"
) {
  // Contracts are deployed using the first signer/account by default
  const [tokenOwner, otherAccount] = await hre.ethers.getSigners();

  const tokenFactory = contract === "MintableToken"
    ? await hre.ethers.getContractFactory("MintableToken")
    : await hre.ethers.getContractFactory("MintableRespectToken");
  const token = await tokenFactory.deploy(tokenOwner, "TOKEN", symbol);
  const tokenAddress = await token.getAddress();

  let mintNonce = 0;
  const buildMintProp = (recipient: AddressLike, amount: BigNumberish) => {
    const cdata = token.interface.encodeFunctionData("mint", [recipient, amount]);
    const msg: Orec.MessageStruct = {
      addr: tokenAddress,
      cdata,
      memo: toUtf8Bytes(`mint${mintNonce}`)
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
      memo: toUtf8Bytes(`burn${burnNonce}`)
    };
    burnNonce += 1;
    return { msg, id: propId(msg) };
  }

  return { token, tokenOwner, otherAccount, tokenAddress, buildMintProp, buildBurnProp };
}

async function deployOrec(tokenSymbol?: string, tokenType?: TokenType) {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await hre.ethers.getSigners();

  const { token, tokenOwner, tokenAddress, buildMintProp, buildBurnProp } = await deployToken(tokenSymbol, tokenType);

  const Orec = await hre.ethers.getContractFactory("Orec");
  const orec = await Orec.deploy(
    tokenAddress,
    DAY_1, DAY_6, 5, MAX_LIVE_VOTES,
  );

  return { orec, token, tokenOwner, tokenAddress, buildMintProp, buildBurnProp };
}

async function deployOrecWithToken() {
  return await deployOrec();
}

async function deployOrecWithRespect() {
  const r = await deployOrec("RES", "MintableRespectToken");
  const { token } = r;
  irespectId = await (token as MintableRespectToken).respectInterfaceId();
  return r;
}

async function _deployOrecWithProposals(tokenType: TokenType) {
  const { orec, token, tokenOwner, tokenAddress, buildMintProp, buildBurnProp } = tokenType === "MintableToken"
    ? await loadFixture(deployOrecWithToken)
    : await loadFixture(deployOrecWithRespect);

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

async function deployOrecWithProposals() {
  return await _deployOrecWithProposals("MintableToken");
}

async function deployOrecWithRespAndProposals() {
  const r = await _deployOrecWithProposals("MintableRespectToken");
  const { token } = r;
  expect(await token.supportsInterface(irespectId)).to.be.true;
  return r;
}

async function _deployOrecWithProposalsAndBalances(
  tokenType: TokenType,
  transferOwnershipToOrec: boolean = true
) {
  const vars = tokenType === "MintableToken"
    ? await loadFixture(deployOrecWithProposals)
    : await loadFixture(deployOrecWithRespAndProposals);
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
  if (transferOwnershipToOrec) {
    await token.transferOwnership(orec);
  }

  return vars;
}

async function deployOrecWithProposalsAndBalances() {
  return await _deployOrecWithProposalsAndBalances("MintableToken");
}

async function deployOrecWithProposalsAndBalancesNoTr() {
  return await _deployOrecWithProposalsAndBalances("MintableToken", false);
}

async function deployOrecRespWithProposalsAndBalances() {
  const r = await _deployOrecWithProposalsAndBalances("MintableRespectToken");
  const { token } = r;
  expect(await token.supportsInterface(irespectId)).to.be.true;
  return r;
}

describe("Orec", function () {
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
    await acc.vote(pid, vtype, toUtf8Bytes(memo));
    // await expect(acc.vote(pid, vtype, toUtf8Bytes(memo))).to.not.be.reverted;
    const storedVote = await orec.getLiveVote(pid, voter);
    expect(storedVote.vtype).to.be.equal(vtype);
    expect(storedVote.weight).to.be.equal(expWeight);
  }

  async function expectVoteReverted(
    orec: Orec,
    token: MintableToken,
    proposal: PropId | Orec.MessageStruct,
    voter: Signer,
    vtype: VoteType,
    memo: string = "",
    expectedErrorName?: string
  ) {
    const pid = isPropId(proposal) ? proposal : propId(proposal);
    const acc = orec.connect(voter);
    if (expectedErrorName === undefined) {
      await expect(acc.vote(pid, vtype, toUtf8Bytes(memo))).to.be.reverted
    } else {
      await expect(acc.vote(pid, vtype, toUtf8Bytes(memo)))
        .to.be.revertedWithCustomError(orec, expectedErrorName);
    }
  }

  async function expectDeleted(orec: Orec, propId: PropId) {
    const propState = await orec.proposals(propId);
    expect(propState.createTime).to.be.equal(0);
    expect(propState.yesWeight).to.be.equal(0);
    expect(propState.noWeight).to.be.equal(0);
  }

  async function expectExecution(
    orec: Orec,
    prop: { msg: Orec.MessageStruct, id: PropId },
    expectedEvent: "Executed" | "ExecutionFailed" = "Executed",
    gasLimit?: bigint
  ) {
    await expect(orec.execute(prop.msg, { gasLimit }))
      .to.emit(orec, expectedEvent).withArgs(prop.id, anyValue)
    expect(await orec.isLive(prop.id)).to.be.false;
    expect(await orec.proposalExists(prop.id)).to.be.false;
    await expectDeleted(orec, prop.id);
  }

  describe("Deployment", function () {
    it("Should set respectContract", async function () {
      const { orec, token, tokenAddress } = await loadFixture(deployOrecWithToken);

      expect(await orec.respectContract()).to.be.equal(tokenAddress);
    });

    it("should set itself as the owner", async function() {
      const { orec, token, tokenAddress } = await loadFixture(deployOrecWithToken);

      expect(await orec.owner()).to.be.equal(await orec.getAddress())
    });

    it("should set voteLen, vetoLen and minWeight", async function() {
      const { orec, token, tokenAddress } = await loadFixture(deployOrecWithToken);

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
      const { orec, token, tokenAddress, buildMintProp } = await loadFixture(deployOrecWithToken);

      const accounts = await hre.ethers.getSigners();

      // token.mint(accounts[2], 10).
      const prop = buildMintProp(accounts[2].address, 10);

      await expect(orec.propose(prop.id)).to.not.be.reverted;

      const storedProp = await orec.proposals(prop.id);

      expect(storedProp.yesWeight).to.equal(0);
      expect(storedProp.noWeight).to.equal(0);

      expect(await orec.getStage(prop.id)).to.be.equal(Stage.Voting);
      expect(await orec.getVoteStatus(prop.id)).to.be.equal(VoteStatus.Failing);
      expect(await orec.isVotePeriod(prop.id)).to.be.true;
      expect(await orec.isVetoOrVotePeriod(prop.id)).to.be.true;
      expect(await orec.isVetoPeriod(prop.id)).to.be.false;
      expect(await orec.isVoteActive(prop.id)).to.be.true;
      expect(await orec.isLive(prop.id)).to.be.true;
    });

    it("should store proposal with current block time as createTime", async function() {
      const { orec, buildMintProp } = await loadFixture(deployOrecWithToken);
      const accounts = await hre.ethers.getSigners();

      const prop = buildMintProp(accounts[3].address, 20);

      const txResp = await orec.propose(prop.id);
      const bl = await txResp.getBlock();
      
      const storedProp = await orec.proposals(prop.id);
      expect(storedProp.createTime).to.equal(bl?.timestamp);
    });

    it("should not allow proposing what already exist", async function() {
      const { orec, token, tokenAddress, buildMintProp } = await loadFixture(deployOrecWithToken);
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

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Voting);
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token, proposals: props} = await loadFixture(deployOrecWithProposals);

        await expectVoteReverted(orec, token, props[0].id, accounts[0], VoteType.None);

        await time.increase(MIN_1);

        await expectVoteReverted(orec, token, props[0].id, accounts[1], VoteType.None);

        await time.increase(22n * HOUR_1 + 59n * MIN_1);

        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.None);

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Voting);
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

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Voting);
      });
      it("should allow voting no during [createTime, createTime+voteLen) period", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.No);

        await time.increase(HOUR_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.No);

        await time.increase(22n * HOUR_1 + 55n * MIN_1);

        await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.No);

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Voting);
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

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Voting);
      });
      it("should allow switching from yes to no during [createTime, createTime+voteLen)", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.Yes);

        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Passing);

        await time.increase(MIN_1);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.No);

        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Failing);

        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Voting);
      });
      it("should allow switching from no to yes during [createTime, createTime+voteLen)", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.No);

        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Failing);

        await time.increase(MIN_1);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.Yes);

        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Passing);

        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Voting);
      });
      it("should subtract from yesWeight and add to noWeight in case of a switched vote to yes", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.Yes);
        let expYesWeight = await token.balanceOf(accounts[3]);
        let expNoWeight = 0n;
        let prop = await orec.proposals(props[1].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Passing);

        await time.increase(MIN_1);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.No);
        expNoWeight = expYesWeight;
        expYesWeight = 0n;
        prop = await orec.proposals(props[1].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Failing);

        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Voting);
      });

      it("should subtract from noWeight and add to yesWeight in case of a switched vote to no", async function() {
        const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.No);
        let expNoWeight = await token.balanceOf(accounts[3]);
        let expYesWeight = 0n;
        let prop = await orec.proposals(props[1].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Failing);

        await time.increase(MIN_1);

        await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.Yes);
        expYesWeight = expNoWeight;
        expNoWeight = 0n;
        prop = await orec.proposals(props[1].id);
        expect(prop.yesWeight).to.be.equal(expYesWeight);
        expect(prop.noWeight).to.be.equal(expNoWeight);

        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Passing);

        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Voting);
      });

      it("should create a proposal if it does not exist yet", async function() {
        const { orec, accounts, token, voteLen, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalances);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        let storedProp = await orec.proposals(prop1.id);
        expect(await orec.proposalExists(prop1.id)).to.be.true;
        expect(storedProp.createTime).not.equal(0);
        expect(storedProp.yesWeight).to.equal(await token.balanceOf(accounts[6].address));
        expect(storedProp.noWeight).to.be.equal(0);
        expect(await orec.getStage(prop1.id)).to.be.equal(Stage.Voting);

        await time.increase(HOUR_1);
        
        // Check if others can vote on the new proposal as well
        await expectVoteCounted(orec, token, prop1.id, accounts[7], VoteType.Yes);
        storedProp = await orec.proposals(prop1.id);
        expect(await orec.proposalExists(prop1.id)).to.be.true;
        const newWeight =
          await token.balanceOf(accounts[6].address) + await token.balanceOf(accounts[7].address);
        expect(storedProp.yesWeight).to.equal(newWeight);
        expect(storedProp.noWeight).to.be.equal(0);

        await time.increase(MIN_1);

        await expectVoteCounted(orec, token, prop1.id, accounts[8], VoteType.No);
        storedProp = await orec.proposals(prop1.id);
        expect(await orec.proposalExists(prop1.id)).to.be.true;
        expect(storedProp.yesWeight).to.equal(newWeight);
        expect(storedProp.noWeight).to.be.equal(
          await token.balanceOf(accounts[8].address)
        );

        expect(await orec.getStage(prop1.id)).to.be.equal(Stage.Voting);
      })

      // TODO:
      it("should not allow voting again with the same weight", async function() {
        const { orec, accounts, token, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalances);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        await expectVoteReverted(orec, token, prop1.id, accounts[6], VoteType.Yes, "", "AlreadyVoted");
      });
      it("should allow updating your yes vote with updated respect to bigger amount", async function() {
        const { orec, accounts, token, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalancesNoTr);

        expect(await token.balanceOf(accounts[6].address)).to.be.equal(89);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        const prop1State = await orec.proposals(prop1.id);
        expect(prop1State.yesWeight).to.be.equal(89);

        await token.mint(accounts[6].address, 10);
        expect(await token.balanceOf(accounts[6].address)).to.be.equal(99);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        const prop1State2 = await orec.proposals(prop1.id);
        expect(prop1State2.yesWeight).to.be.equal(99);
      });
      it("should allow updating your yes vote with updated respect to smaller amount", async function() {
        const { orec, accounts, token, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalancesNoTr);

        expect(await token.balanceOf(accounts[6].address)).to.be.equal(89);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        const prop1State = await orec.proposals(prop1.id);
        expect(prop1State.yesWeight).to.be.equal(89);

        await token.burn(accounts[6].address, 10);
        expect(await token.balanceOf(accounts[6].address)).to.be.equal(79);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        const prop1State2 = await orec.proposals(prop1.id);
        expect(prop1State2.yesWeight).to.be.equal(79);
      })
      it("should allow updating your no vote with updated respect to bigger amount", async function() {
        const { orec, accounts, token, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalancesNoTr);

        expect(await token.balanceOf(accounts[6].address)).to.be.equal(89);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.No);
        const prop1State = await orec.proposals(prop1.id);
        expect(prop1State.noWeight).to.be.equal(89);

        await token.mint(accounts[6].address, 10);
        expect(await token.balanceOf(accounts[6].address)).to.be.equal(99);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.No);
        const prop1State2 = await orec.proposals(prop1.id);
        expect(prop1State2.noWeight).to.be.equal(99);

      });
      it("should allow updating your no vote with updated respect to smaller amount", async function() {
        const { orec, accounts, token, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalancesNoTr);

        expect(await token.balanceOf(accounts[6].address)).to.be.equal(89);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.No);
        const prop1State = await orec.proposals(prop1.id);
        expect(prop1State.noWeight).to.be.equal(89);

        await token.burn(accounts[6].address, 10);
        expect(await token.balanceOf(accounts[6].address)).to.be.equal(79);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.No);
        const prop1State2 = await orec.proposals(prop1.id);
        expect(prop1State2.noWeight).to.be.equal(79);
      })
      it("should set new vote to updated respect balance when switching vote", async function() {
        const { orec, accounts, token, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalancesNoTr);

        expect(await token.balanceOf(accounts[6].address)).to.be.equal(89);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.No);
        const prop1State = await orec.proposals(prop1.id);
        expect(prop1State.noWeight).to.be.equal(89);
        expect(prop1State.yesWeight).to.be.equal(0);

        await token.burn(accounts[6].address, 10);
        expect(await token.balanceOf(accounts[6].address)).to.be.equal(79);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        const prop1State2 = await orec.proposals(prop1.id);
        expect(prop1State2.noWeight).to.be.equal(0);
        expect(prop1State2.yesWeight).to.be.equal(79);

        await token.mint(accounts[6].address, 100);
        expect(await token.balanceOf(accounts[6].address)).to.be.equal(179);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.No);
        const prop1State3 = await orec.proposals(prop1.id);
        expect(prop1State3.noWeight).to.be.equal(179);
        expect(prop1State3.yesWeight).to.be.equal(0);
      });
    });

    describe("vetoTime (period: [createTime + voteLen, createTime + voteLen + vetoLen)", function() {
      it("should not allow voting yes during [createTime+voteLen, createTime+voteLen+vetoLen) period", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Voting);

        // Try during vote time first
        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.Yes);

        await time.increase(voteLen + 1n);
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);

        await expectVoteReverted(orec, token, props[0].id, accounts[1], VoteType.Yes, "", "VotePeriodOver");

        await time.increase(MIN_1);

        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.Yes, "", "VotePeriodOver");
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.Yes);

        await time.increase(voteLen + MIN_1);
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);

        await expectVoteReverted(orec, token, props[0].id, accounts[1], VoteType.None);
      });

      it("should allow voting no during [createTime+voteLen, createTime+voteLen+vetoLen) period", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Voting);

        await time.increase(voteLen);
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);

        await expectVoteReverted(orec, token, props[0].id, accounts[1], VoteType.Yes);
        await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.No);

        await time.increase(HOUR_1);
        await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.No);

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);
      })

      it("should increment noWeight of proposal by respect of a voter, when voting no", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);

        await time.increase(voteLen + 1n);
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);

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

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);
      })
      it("should allow switching from yes to no during [createTime+voteLen, createTime+voteLen+vetoLen)", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);

        await time.increase(voteLen + 100n);
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);
        expect(await orec.getVoteStatus(props[0].id)).to.be.equal(VoteStatus.Passing);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.No);
      });
      it("switching from yes to no should subtract from yesWeight and add to noWeight", async function() {
        const { orec, accounts, token, voteLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);

        let prop = await orec.proposals(props[0].id);
        const w = prop.yesWeight;

        await time.increase(voteLen + HOUR_1);
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);

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
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);

        await expectVoteReverted(orec,token, props[0].id, accounts[2], VoteType.Yes, "", "VotePeriodOver");

        await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.No);
        await time.increase(MIN_1);
        await expectVoteReverted(orec, token, props[0].id, accounts[0], VoteType.Yes, "", "VotePeriodOver");

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);
      })

      it("should not allow voting no again with the same weight", async function() {
        const { orec, accounts, token, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalancesNoTr);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, prop1.id, accounts[0], VoteType.No);

        // Go to veto stage
        await time.increase(DAY_1);
        expect(await orec.getStage(prop1.id)).to.be.equal(Stage.Veto);

        await expectVoteCounted(orec, token, prop1.id, accounts[1], VoteType.No);


        await expectVoteReverted(orec, token, prop1.id, accounts[0], VoteType.No, "", "AlreadyVoted");
        await expectVoteReverted(orec, token, prop1.id, accounts[1], VoteType.No, "", "AlreadyVoted");
      });
      it("should allow updating your no vote with updated respect to bigger amount", async function() {
        const { orec, accounts, token, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalancesNoTr);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, prop1.id, accounts[0], VoteType.No);

        const prop1State1 = await orec.proposals(prop1.id);
        expect(prop1State1.yesWeight).to.be.equal(89);
        expect(prop1State1.noWeight).to.be.equal(5);

        // Go to veto stage
        await time.increase(DAY_1);
        expect(await orec.getStage(prop1.id)).to.be.equal(Stage.Veto);

        await expectVoteCounted(orec, token, prop1.id, accounts[1], VoteType.No);

        const prop1State2 = await orec.proposals(prop1.id);
        expect(prop1State2.yesWeight).to.be.equal(89);
        expect(prop1State2.noWeight).to.be.equal(5 + 8);

        // Update balances
        await token.mint(accounts[0], 1);
        await token.mint(accounts[1], 2);

        await expectVoteCounted(orec, token, prop1.id, accounts[0], VoteType.No);
        await expectVoteCounted(orec, token, prop1.id, accounts[1], VoteType.No);

        const prop1State3 = await orec.proposals(prop1.id);
        expect(prop1State3.yesWeight).to.be.equal(89);
        expect(prop1State3.noWeight).to.be.equal(6 + 10);
      })
      it("should allow updating your no vote with updated respect to smaller amount", async function() {
        const { orec, accounts, token, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalancesNoTr);

        const prop1 = buildMintProp(accounts[0].address, 10);
        await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, prop1.id, accounts[0], VoteType.No);

        const prop1State1 = await orec.proposals(prop1.id);
        expect(prop1State1.yesWeight).to.be.equal(89);
        expect(prop1State1.noWeight).to.be.equal(5);

        // Go to veto stage
        await time.increase(DAY_1);
        expect(await orec.getStage(prop1.id)).to.be.equal(Stage.Veto);

        await expectVoteCounted(orec, token, prop1.id, accounts[1], VoteType.No);

        const prop1State2 = await orec.proposals(prop1.id);
        expect(prop1State2.yesWeight).to.be.equal(89);
        expect(prop1State2.noWeight).to.be.equal(5 + 8);

        // Update balances
        await token.burn(accounts[0], 1);
        await token.burn(accounts[1], 2);

        await expectVoteCounted(orec, token, prop1.id, accounts[0], VoteType.No);
        await expectVoteCounted(orec, token, prop1.id, accounts[1], VoteType.No);

        const prop1State3 = await orec.proposals(prop1.id);
        expect(prop1State3.yesWeight).to.be.equal(89);
        expect(prop1State3.noWeight).to.be.equal(4 + 6);

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
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Execution);
        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.Yes, "", "VotePeriodOver");
        // Case when proposal is rejected with no
        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Expired);
        await expectVoteReverted(orec, token, props[1].id, accounts[1], VoteType.Yes, "", "VotePeriodOver");
        // Case when proposal does not have any votes
        expect(await orec.getStage(props[2].id)).to.be.equal(Stage.Expired);
        await expectVoteReverted(orec, token, props[2].id, accounts[3], VoteType.Yes, "VotePeriodOver");
      });
      it("should not allow voting with none vtype", async function() {
        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].id, accounts[5], VoteType.No);
        await expectVoteCounted(orec, token, props[1].id, accounts[4], VoteType.Yes);

        await time.increase(voteLen + vetoLen + MIN_1);

        // Case when proposal is passed
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Execution);
        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.None);
        // Case when proposal is rejected with no
        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Expired);
        await expectVoteReverted(orec, token, props[1].id, accounts[1], VoteType.None);
        // Case when proposal does not have any votes
        expect(await orec.getStage(props[2].id)).to.be.equal(Stage.Expired);
        await expectVoteReverted(orec, token, props[2].id, accounts[3], VoteType.None);

      })
      it("should not allow voting no", async function() {

        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec, token, props[0].id, accounts[6], VoteType.Yes);
        await expectVoteCounted(orec, token, props[1].id, accounts[5], VoteType.No);
        await expectVoteCounted(orec, token, props[1].id, accounts[4], VoteType.Yes);

        await time.increase(voteLen + vetoLen + MIN_1);

        // Case when proposal is passed
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Execution);
        await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.No, "", "ProposalVoteInactive");
        // Case when proposal is rejected with no
        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Expired);
        await expectVoteReverted(orec, token, props[1].id, accounts[1], VoteType.No, "", "ProposalVoteInactive");
        // Case when proposal does not have any votes
        expect(await orec.getStage(props[2].id)).to.be.equal(Stage.Expired);
        await expectVoteReverted(orec, token, props[2].id, accounts[3], VoteType.No, "", "ProposalVoteInactive");
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

      expect(await orec.getStage(prop1.id)).to.be.equal(Stage.Voting);
      expect(await orec.getStage(prop2.id)).to.be.equal(Stage.Voting);
      expect(await orec.getVoteStatus(prop1.id)).to.be.equal(VoteStatus.Passing);
      expect(await orec.getVoteStatus(prop2.id)).to.be.equal(VoteStatus.Passing);

      await expect(orec.execute(prop1.msg)).to.be.reverted;
      await expect(orec.execute(prop2.msg)).to.be.reverted;
      await time.increase(HOUR_1 * 10n);
      await expect(orec.execute(prop1.msg)).to.be.reverted;
      await expect(orec.execute(prop2.msg)).to.be.reverted;

      expect(await orec.getStage(prop1.id)).to.be.equal(Stage.Voting);
      expect(await orec.getStage(prop2.id)).to.be.equal(Stage.Voting);
      expect(await orec.getVoteStatus(prop1.id)).to.be.equal(VoteStatus.Passing);
      expect(await orec.getVoteStatus(prop2.id)).to.be.equal(VoteStatus.Passing);
    })
    it("should not allow executing during vetoTime [createTime+voteLen, createTime+voteLen+vetoLen)", async function() {
      const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

      await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);
      await expectVoteCounted(orec, token, props[1].id, accounts[6], VoteType.Yes);

      await time.increase(DAY_1);
      await expect(orec.execute(props[0].msg)).to.be.reverted;
      await expect(orec.execute(props[1].msg)).to.be.reverted;

      expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Veto);
      expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Veto);
      expect(await orec.getVoteStatus(props[0].id)).to.be.equal(VoteStatus.Passing);
      expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Passing);

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
        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Expired);
        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Expired);
        expect(await orec.getVoteStatus(props[0].id)).to.be.equal(VoteStatus.Failed);
        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Failed);
        
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

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Expired);
        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Expired);
        expect(await orec.getVoteStatus(props[0].id)).to.be.equal(VoteStatus.Failed);
        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Failed);
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

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Expired);
        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Expired);
        expect(await orec.getVoteStatus(props[0].id)).to.be.equal(VoteStatus.Failed);
        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Failed);
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

        expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Execution);
        expect(await orec.getStage(props[1].id)).to.be.equal(Stage.Execution);
        expect(await orec.getVoteStatus(props[0].id)).to.be.equal(VoteStatus.Passed);
        expect(await orec.getVoteStatus(props[1].id)).to.be.equal(VoteStatus.Passed);

        await expectExecution(orec, props[0], "Executed");
        await expectExecution(orec, props[1], "Executed");
      });
      it("should allow executing (by anyone) if noWeight * 2 < yesWeight and noWeight == minWeight", async function() {
        const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        // Proposal 1: 5 Respect voting yes. Proposal passes
        await expectVoteCounted(orec, token, props[2].id, accounts[0], VoteType.Yes);

        // Proposal 2: 5 Respect Voting yes, 2 - voting no. Proposal passes
        await expectVoteCounted(orec, token, props[3].id, accounts[10], VoteType.Yes);
        await expectVoteCounted(orec, token, props[3].id, accounts[8], VoteType.No);

        await time.increase(voteLen + vetoLen + 1n);

        expect(await orec.getStage(props[3].id)).to.be.equal(Stage.Execution);
        expect(await orec.getStage(props[2].id)).to.be.equal(Stage.Execution);
        expect(await orec.getVoteStatus(props[3].id)).to.be.equal(VoteStatus.Passed);
        expect(await orec.getVoteStatus(props[2].id)).to.be.equal(VoteStatus.Passed);

        await expectExecution(orec, props[3], "Executed");
        await expectExecution(orec, props[2], "Executed");
      });
      it("should not allow executing if execution was already attempted and failed", async function() {
        const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

        // accounts[0] does not have that much to burn
        const prop = buildBurnProp(accounts[0].address, 1000000);

        await expectVoteCounted(orec, token, prop.id, accounts[0], VoteType.Yes);
        await expectVoteCounted(orec, token, prop.id, accounts[1], VoteType.Yes);

        expect(await orec.getVoteStatus(prop.id)).to.be.equal(VoteStatus.Passing);

        await time.increase(voteLen + vetoLen);

        expect(await orec.getVoteStatus(prop.id)).to.be.equal(VoteStatus.Passed);

        await expectExecution(orec, prop, "ExecutionFailed");

        await expect(orec.execute(prop.msg)).to.be.reverted;
      });
      it("should not allow executing if execution was already successful", async function() {
        const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

        await expectVoteCounted(orec,token, props[3].id, accounts[1], VoteType.Yes);

        expect(await orec.getVoteStatus(props[3].id)).to.be.equal(VoteStatus.Passing);
        
        await time.increase(voteLen + vetoLen);
        expect(await orec.getVoteStatus(props[3].id)).to.be.equal(VoteStatus.Passed);

        await expectExecution(orec, props[3], "Executed");

        await expect(orec.execute(props[3].msg)).to.be.reverted;
      })

      describe("executing messages to MintableToken", function() {
        it("should mint tokens", async function() {
          const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

          // 0th proposal is for issuing 5 to accounts[0]
          const initAcc0Balance = await token.balanceOf(accounts[0]);

          await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          await expectExecution(orec, props[0], "Executed");

          expect(await token.balanceOf(accounts[0])).to.be.equal(initAcc0Balance + 5n);
        });

        it("should burn tokens", async function() {
          const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

          // 0th proposal is for issuing 5 to accounts[0]
          const initAcc6Balance = await token.balanceOf(accounts[6]);

          const prop = buildBurnProp(accounts[6].address, 10);

          await expectVoteCounted(orec, token, prop.id, accounts[0], VoteType.Yes);
          await expectVoteCounted(orec, token, prop.id, accounts[1], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          await expectExecution(orec, prop, "Executed");

          expect(await token.balanceOf(accounts[6])).to.be.equal(initAcc6Balance - 10n);
        });

        it("should emit ExecutionFailed in case of failed call", async function() {
          const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

          // accounts[0] does not have that much to burn
          const prop = buildBurnProp(accounts[0].address, 1000000);

          await expectVoteCounted(orec, token, prop.id, accounts[0], VoteType.Yes);
          await expectVoteCounted(orec, token, prop.id, accounts[1], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          await expectExecution(orec, prop, "ExecutionFailed");
        });
      })

      describe("gas requirements", function() {

        it("should revert with out-of-gas error in case not enough gas is provided to execute proposed transaction", async function() {
          const { orec, accounts, token, voteLen, vetoLen, buildMintProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

          const gasUserFactory = await hre.ethers.getContractFactory("GasUser");
          const gasUser = await gasUserFactory.deploy();
          const data = gasUser.interface.encodeFunctionData("useGas", [80]);

          const msg: Orec.MessageStruct = {
            addr: await gasUser.getAddress(),
            cdata: data,
            memo: toUtf8Bytes("")
          };
          const id = propId(msg);

          await expectVoteCounted(orec, token, id, accounts[0], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          expect(await orec.getStage(id)).to.be.equal(Stage.Execution);

          const execTxData = orec.interface.encodeFunctionData(
            "execute", [msg]
          );

          const totalGas = await hre.ethers.provider.estimateGas({
            from: accounts[0].address,
            to: await orec.getAddress(),
            data: execTxData
          });

          const propExecGas = await hre.ethers.provider.estimateGas({
            from: await orec.getAddress(),
            to: await gasUser.getAddress(),
            data: hexlify(msg.cdata)
          });

          // Gas estimation should work
          expect(totalGas).to.be.greaterThan(propExecGas);

          const gasLimit = totalGas - (propExecGas / 2n);

          console.log("gasLimit: ", gasLimit);

          await expect(orec.execute(msg, { gasLimit }))
            .to.be.revertedWithCustomError(orec, "OutOfGas");
          
          expect(await orec.proposalExists(id)).to.be.true;
          expect(await orec.isLive(id)).to.be.true;
        })

        it("should not revert if estimated amount of gas is provided", async function() {
          // Same as the previous test except estimated amount of gas is used.
          const { orec, accounts, token, voteLen, vetoLen, buildMintProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

          const gasUserFactory = await hre.ethers.getContractFactory("GasUser");
          const gasUser = await gasUserFactory.deploy();
          const data = gasUser.interface.encodeFunctionData("useGas", [80]);

          const msg: Orec.MessageStruct = {
            addr: await gasUser.getAddress(),
            cdata: data,
            memo: toUtf8Bytes("")
          };
          const id = propId(msg);

          await expectVoteCounted(orec, token, id, accounts[0], VoteType.Yes);

          await time.increase(voteLen + vetoLen);

          expect(await orec.getStage(id)).to.be.equal(Stage.Execution);

          const execTxData = orec.interface.encodeFunctionData(
            "execute", [msg]
          );

          const totalGas = await hre.ethers.provider.estimateGas({
            from: accounts[0].address,
            to: await orec.getAddress(),
            data: execTxData
          });

          await expectExecution(orec, { msg, id }, "Executed", totalGas);
        });
      })
    })
  });

  describe("signal", function() {
    it("should emit a signal event if a proposal is passed to call signal on itself", async function() {
      const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

      const signalBytes = toUtf8Bytes("Next meeting: 2024-05-28");
      const signalType = 3;
      const cdata = orec.interface.encodeFunctionData("signal", [signalType, signalBytes]);
      const msg: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: toUtf8Bytes("signal1")
      };
      const pId = propId(msg);

      await expectVoteCounted(orec, token, pId, accounts[1], VoteType.Yes);

      await time.increase(voteLen + vetoLen);

      await expect(orec.execute(msg))
        .to.emit(orec, "Executed").and
        .to.emit(orec, "Signal").withArgs(signalType, signalBytes);
    });

    it("should not allow calling signal for anyone else", async function() {
      const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

      await expect(orec.signal(3, toUtf8Bytes("some data"))).to.be.reverted;
    });
  });

  describe("canceling a proposal", function() {
    it("should allow removing a passed proposal by passing a proposal", async function() {
      const { orec, accounts, token, voteLen, vetoLen, proposals: props } = await loadFixture(deployOrecWithProposalsAndBalances);

      await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);

      await time.increase(voteLen + vetoLen);

      expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Execution);

      const cdata = orec.interface.encodeFunctionData("cancelProposal", [props[0].id]);
      const msg: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: toUtf8Bytes("Cancel prop")
      };
      const cancelId = propId(msg);

      await expectVoteCounted(orec, token, cancelId, accounts[0], VoteType.Yes);
      await time.increase(voteLen + vetoLen);

      expect(await orec.getStage(props[0].id)).to.be.equal(Stage.Execution);
      expect(await orec.getStage(cancelId)).to.be.equal(Stage.Execution);

      await expect(orec.execute(msg))
        .to.emit(orec, "Executed").withArgs(cancelId, anyValue)
        .to.emit(orec, "ProposalCanceled").withArgs(props[0].id);

      await expectDeleted(orec, props[0].id);
      await expectDeleted(orec, cancelId);
    });
  })

  describe("Spam prevention", function() {
    it("should not allow having more than max_live_votes of yes votes for non-respected accounts on proposals in voting stage", async function () {
      const { token, accounts, orec, buildMintProp } = await loadFixture(deployOrecWithProposals);

      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[16], VoteType.Yes);
      }

      const prop = buildMintProp(accounts[16].address, 100);
      await expectVoteReverted(orec, token, prop.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
    });

    it("should not allow having more than max_live_votes of yes votes for respected accounts on proposals in voting stage", async function () {
      const { token, accounts, orec, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalances);

      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[4], VoteType.Yes);
      }

      const prop = buildMintProp(accounts[16].address, 100);
      await expectVoteReverted(orec, token, prop.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
    });

    it("should not allow having more than max_live_votes of yes votes for respected accounts on proposals when proposals are in veto stage", async function () {
      const { token, accounts, orec, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalances);

      const props = new Array<ReturnType<typeof buildMintProp>>();
      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[4], VoteType.Yes);
        props.push(prop);
      }

      const prop = buildMintProp(accounts[16].address, 100);
      await expectVoteReverted(orec, token, prop.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");

      await time.increase(DAY_1 + 1n);

      for (const prop of props) {
        expect(await orec.getStage(prop.id)).to.be.equal(Stage.Veto);
      }

      await expectVoteReverted(orec, token, prop.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
    });

    it("should not allow having more than max_live_votes of yes votes on proposals when proposals are in execution stage", async function () {
      const { token, accounts, orec, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalances);

      const props = new Array<ReturnType<typeof buildMintProp>>();
      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[4], VoteType.Yes);
        await expectVoteCounted(orec, token, prop.id, accounts[16], VoteType.Yes);
        props.push(prop);
      }

      const prop = buildMintProp(accounts[16].address, 100);
      await expectVoteReverted(orec, token, prop.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      await expectVoteReverted(orec, token, prop.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");

      await time.increase(DAY_1 + DAY_6 + 1n);

      for (const prop of props) {
        expect(await orec.getStage(prop.id)).to.be.equal(Stage.Execution);
      }

      await expectVoteReverted(orec, token, prop.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      await expectVoteReverted(orec, token, prop.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
    });

    it("should allow voting yes again after max_live_votes limit was reached once proposals voted on have expired", async function() {
      // No respected accounts
      const { token, accounts, orec, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalances);

      expect(await token.balanceOf(accounts[16].address)).to.be.equal(0);
      expect(await token.balanceOf(accounts[4].address)).to.be.equal(34);
      expect(await token.balanceOf(accounts[3].address)).to.be.equal(21);

      const props = new Array<ReturnType<typeof buildMintProp>>();
      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[16], VoteType.Yes);
        // 34 Respect vote
        await expectVoteCounted(orec, token, prop.id, accounts[4], VoteType.Yes);
        // 21 Respect vote
        await expectVoteCounted(orec, token, prop.id, accounts[3], VoteType.No);
        props.push(prop);
      }

      const prop = buildMintProp(accounts[16].address, 100);
      await expectVoteReverted(orec, token, prop.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      await expectVoteReverted(orec, token, prop.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");

      await time.increase(DAY_1 + MIN_1);

      for (const prop of props) {
        expect(await orec.getVoteStatus(prop.id)).to.be.equal(VoteStatus.Failed);
      }

      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[16], VoteType.Yes);
        // 34 Respect vote
        await expectVoteCounted(orec, token, prop.id, accounts[4], VoteType.Yes);
        // 21 Respect vote
        await expectVoteCounted(orec, token, prop.id, accounts[3], VoteType.No);
      }

      const prop2 = buildMintProp(accounts[16].address, 100);
      await expectVoteReverted(orec, token, prop2.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      await expectVoteReverted(orec, token, prop2.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");

      await time.increase(DAY_1 + MIN_1);

      for (let i = 0; i < MAX_LIVE_VOTES - 1; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[16], VoteType.Yes);
      }

      await time.increase(HOUR_1);

      const prop3 = buildMintProp(accounts[15].address, 200);
      await expectVoteCounted(orec, token, prop3.id, accounts[16], VoteType.Yes);

      const prop4 = buildMintProp(accounts[15].address, 100);
      await expectVoteReverted(orec, token, prop4.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");

      await time.increase(DAY_1 + MIN_1);

      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[10].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[16], VoteType.Yes);
      }

      const prop5 = buildMintProp(accounts[9].address, 100);
      await expectVoteReverted(orec, token, prop5.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
    });

    it("should allow voting yes again after max_live_votes limit was reached once proposals voted on have expired *and* been executed", async function() {
      const { token, accounts, orec, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalances);

      const props: Array<ReturnType<typeof buildMintProp>> = [];
      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[4], VoteType.Yes);
        props.push(prop);
      }

      const prop = buildMintProp(accounts[16].address, 100);
      await expectVoteReverted(orec, token, prop.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");

      await time.increase(DAY_1 + DAY_6 + 1n);

      for (const prop of props) {
        await expectExecution(orec, prop, "Executed");
      }

      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[4], VoteType.Yes);
        await expectVoteCounted(orec, token, prop.id, accounts[16], VoteType.Yes);
      }

      const prop2 = buildMintProp(accounts[16].address, 100);
      await expectVoteReverted(orec, token, prop2.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      // Try with non-respected account as well
      await expectVoteReverted(orec, token, prop2.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
    });

    it("should allow voting no even though max_live_votes limit was reached", async function() {
      const { token, accounts, orec, buildMintProp } = await loadFixture(deployOrecWithProposalsAndBalances);

      const props: Array<ReturnType<typeof buildMintProp>> = [];
      for (let i = 0; i < MAX_LIVE_VOTES; i++) {
        const prop = buildMintProp(accounts[16].address, 100);
        await expectVoteCounted(orec, token, prop.id, accounts[4], VoteType.Yes);
        await expectVoteCounted(orec, token, prop.id, accounts[16], VoteType.Yes);
        props.push(prop);
      }

      const prop = buildMintProp(accounts[16].address, 100);
      // Yes fails
      await expectVoteReverted(orec, token, prop.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      await expectVoteReverted(orec, token, prop.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      // No succeeds
      await expectVoteCounted(orec, token, prop.id, accounts[4], VoteType.No);
      await expectVoteCounted(orec, token, prop.id, accounts[16], VoteType.No);

      // Go to veto stage
      await time.increase(DAY_1 * 2n);
      for (const prop of props) {
        expect(await orec.getStage(prop.id)).to.be.equal(Stage.Veto);
      }

      const prop2 = buildMintProp(accounts[16].address, 100);
      // Yes fails
      await expectVoteReverted(orec, token, prop2.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      await expectVoteReverted(orec, token, prop2.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      // No succeeds
      await expectVoteCounted(orec, token, prop2.id, accounts[4], VoteType.No);
      await expectVoteCounted(orec, token, prop2.id, accounts[16], VoteType.No);

      // Go to execute stage
      await time.increase(DAY_6);
      for (const prop of props) {
        expect(await orec.getStage(prop.id)).to.be.equal(Stage.Execution);
      }

      const prop3 = buildMintProp(accounts[16].address, 100);
      // Yes fails
      await expectVoteReverted(orec, token, prop3.id, accounts[4], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      await expectVoteReverted(orec, token, prop3.id, accounts[16], VoteType.Yes, "", "MaxLiveYesVotesExceeded");
      // No succeeds
      await expectVoteCounted(orec, token, prop3.id, accounts[4], VoteType.No);
      await expectVoteCounted(orec, token, prop3.id, accounts[16], VoteType.No);
    })
  });

  describe("support for IRespect implementers as respectContract(s)", function() {

    describe("Deployment", function () {
      it("Should set respectContract", async function () {
        const { orec, token, tokenAddress } = await loadFixture(deployOrecWithRespect);
        expect(await token.supportsInterface(irespectId)).to.be.true;

        expect(await orec.respectContract()).to.be.equal(tokenAddress);
      });

      it("should set itself as the owner", async function() {
        const { orec, token, tokenAddress } = await loadFixture(deployOrecWithToken);

        expect(await orec.owner()).to.be.equal(await orec.getAddress())
      });

      it("should set voteLen, vetoLen and minWeight", async function() {
        const { orec, token, tokenAddress } = await loadFixture(deployOrecWithToken);

        expect(await orec.voteLen()).to.be.equal(DAY_1);
        expect(await orec.vetoLen()).to.be.equal(DAY_6);
        expect(await orec.minWeight()).to.be.equal(5);
      })
    });

    describe("vote", function() {
      describe("voteTime (period: [createTime, createTime + voteLen))", function() {
        it("should allow voting yes during [createTime, createTime + voteLen) period", async function () {
          const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecWithRespAndProposals);

          await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.Yes);

          await time.increase(HOUR_1);

          await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.Yes);

          await time.increase(22n * HOUR_1 + 55n * MIN_1);

          await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.Yes);
        });
        it("should not allow voting with none vtype", async function() {
          const { orec, accounts, token, proposals: props} = await loadFixture(deployOrecWithRespAndProposals);

          await expectVoteReverted(orec, token, props[0].id, accounts[0], VoteType.None);

          await time.increase(HOUR_1);

          await expectVoteReverted(orec, token, props[0].id, accounts[1], VoteType.None);

          await time.increase(22n * HOUR_1 + 59n * MIN_1);

          await expectVoteReverted(orec, token, props[0].id, accounts[2], VoteType.None);
        })
        it("should increment yesWeight of proposal by the token balance of voter", async function() {
          const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecRespWithProposalsAndBalances);

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
          const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecRespWithProposalsAndBalances);

          await expectVoteCounted(orec, token, props[0].id, accounts[0], VoteType.No);

          await time.increase(HOUR_1);

          await expectVoteCounted(orec, token, props[0].id, accounts[1], VoteType.No);

          await time.increase(22n * HOUR_1 + 55n * MIN_1);

          await expectVoteCounted(orec, token, props[0].id, accounts[2], VoteType.No);
        })
        it("should increment noWeight of proposal by the token balance of a voter", async function() {
          const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecRespWithProposalsAndBalances);

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
          const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecRespWithProposalsAndBalances);

          await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.Yes);

          await time.increase(MIN_1);

          await expectVoteCounted(orec, token, props[1].id, accounts[3], VoteType.No);
        });
        it("should subtract from yesWeight and add to noWeight in case of a switched vote", async function() {
          const { orec, accounts, token, proposals: props } = await loadFixture(deployOrecRespWithProposalsAndBalances);

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

        it("should create a proposal if it does not exist yet", async function() {
          const { orec, accounts, token, voteLen, buildMintProp } = await loadFixture(deployOrecRespWithProposalsAndBalances);

          const prop1 = buildMintProp(accounts[0].address, 10);
          await expectVoteCounted(orec, token, prop1.id, accounts[6], VoteType.Yes);
          let storedProp = await orec.proposals(prop1.id);
          expect(await orec.proposalExists(prop1.id)).to.be.true;
          expect(storedProp.createTime).not.equal(0);
          expect(storedProp.yesWeight).to.equal(await token.balanceOf(accounts[6].address));
          expect(storedProp.noWeight).to.be.equal(0);

          await time.increase(HOUR_1);
          
          // Check if others can vote on the new proposal as well
          await expectVoteCounted(orec, token, prop1.id, accounts[7], VoteType.Yes);
          storedProp = await orec.proposals(prop1.id);
          expect(await orec.proposalExists(prop1.id)).to.be.true;
          const newWeight =
            await token.balanceOf(accounts[6].address) + await token.balanceOf(accounts[7].address);
          expect(storedProp.yesWeight).to.equal(newWeight);
          expect(storedProp.noWeight).to.be.equal(0);

          await time.increase(MIN_1);

          await expectVoteCounted(orec, token, prop1.id, accounts[8], VoteType.No);
          storedProp = await orec.proposals(prop1.id);
          expect(await orec.proposalExists(prop1.id)).to.be.true;
          expect(storedProp.yesWeight).to.equal(newWeight);
          expect(storedProp.noWeight).to.be.equal(
            await token.balanceOf(accounts[8].address)
          );
        })
      });
    })
  })

  describe("Settings", function() {
    it("should allow itself to change voteLen", async function() {
      const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

      const cdata = orec.interface.encodeFunctionData("setPeriodLengths", [DAY_1 * 2n, (await orec.vetoLen())]);
      const msg: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: toUtf8Bytes("setVoteLen1")
      };
      const pId = propId(msg);

      await expectVoteCounted(orec, token, pId, accounts[1], VoteType.Yes);

      await time.increase(voteLen + vetoLen);

      await expectExecution(orec, { msg, id: pId }, "Executed");

      expect(await orec.voteLen()).to.be.equal(DAY_1 * 2n);

      // Try voting later to test the new setting
      const msg2: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: toUtf8Bytes("setVoteLen2")
      };
      const pId2 = propId(msg2);
      await expectVoteCounted(orec, token, pId2, accounts[1], VoteType.Yes);
      await time.increase(voteLen + HOUR_1 * 6n);
      await expectVoteCounted(orec, token, pId2, accounts[2], VoteType.Yes);
    });
    it("should allow itself to change vetoLen", async function() {
      const { orec, accounts, token, voteLen, vetoLen, buildBurnProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

      expect(await orec.vetoLen()).to.be.equal(DAY_6);

      const cdata = orec.interface.encodeFunctionData("setPeriodLengths", [(await orec.voteLen()), DAY_1]);
      const msg: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: toUtf8Bytes("setVoteLen1")
      };
      const pId = propId(msg);

      await expectVoteCounted(orec, token, pId, accounts[1], VoteType.Yes);

      await time.increase(voteLen + vetoLen);

      await expectExecution(orec, { msg, id: pId }, "Executed");

      expect(await orec.vetoLen()).to.be.equal(DAY_1);

      // Try vetoing later to test the new setting
      const msg2: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: toUtf8Bytes("setVoteLen2")
      };
      const pId2 = propId(msg2);
      await expectVoteCounted(orec, token, pId2, accounts[1], VoteType.Yes);
      await time.increase(voteLen + DAY_1);
      await expectVoteReverted(orec, token, pId2, accounts[2], VoteType.No, "", "ProposalVoteInactive");
    });
    it("should allow itself to change respect contract", async function() {
      const { orec, accounts, token, voteLen, vetoLen, buildMintProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

      // Create a new token
      const { token: newToken, tokenAddress: newTokenAddress} = await deployToken("TOK1");
      await expect(newToken.mint(accounts[10], 5)).to.not.be.reverted;
      await expect(newToken.mint(accounts[11], 8)).to.not.be.reverted;
      await expect(newToken.mint(accounts[12], 13)).to.not.be.reverted;
      await expect(newToken.mint(accounts[13], 21)).to.not.be.reverted;
      await expect(newToken.mint(accounts[14], 34)).to.not.be.reverted;
      await expect(newToken.mint(accounts[15], 55)).to.not.be.reverted;
      await expect(newToken.mint(accounts[16], 89)).to.not.be.reverted;

      // Set orec ownerRespect to newToken
      const cdata = orec.interface.encodeFunctionData(
        "setRespectContract",
        [newTokenAddress]
      );
      const msg: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: toUtf8Bytes("setOwnerRespect1")
      };
      const pId = propId(msg);

      await expectVoteCounted(orec, token, pId, accounts[1], VoteType.Yes);

      await time.increase(voteLen + vetoLen);

      await expect(orec.execute(msg)).to.emit(orec, "Executed");

      expect(await orec.respectContract()).to.be.equal(newTokenAddress);

      // Test proposals with new token as ownerRespect
      const prop = await buildMintProp(accounts[16].address, 10);
      await expectVoteCounted(orec, newToken, prop.id, accounts[16], VoteType.Yes);
      await time.increase(voteLen + vetoLen);
      await expect(orec.execute(prop.msg)).to.not.be.reverted;

      expect(await token.balanceOf(accounts[16].address)).to.be.equal(10);
    });
    it("should allow itself to change respect contract to IRespect type", async function() {
      const { orec, accounts, token, voteLen, vetoLen, buildMintProp, nonce } = await loadFixture(deployOrecWithProposalsAndBalances);

      // Create a new token
      const { token: newToken, tokenAddress: newTokenAddress} = await deployToken("TOK1", "MintableRespectToken");

      expect(await newToken.supportsInterface(irespectId)).to.be.true;

      await expect(newToken.mint(accounts[10], 5)).to.not.be.reverted;
      await expect(newToken.mint(accounts[11], 8)).to.not.be.reverted;
      await expect(newToken.mint(accounts[12], 13)).to.not.be.reverted;
      await expect(newToken.mint(accounts[13], 21)).to.not.be.reverted;
      await expect(newToken.mint(accounts[14], 34)).to.not.be.reverted;
      await expect(newToken.mint(accounts[15], 55)).to.not.be.reverted;
      await expect(newToken.mint(accounts[16], 89)).to.not.be.reverted;

      // Set orec ownerRespect to newToken
      const cdata = orec.interface.encodeFunctionData(
        "setRespectContract",
        [newTokenAddress]
      );
      const msg: Orec.MessageStruct = {
        addr: await orec.getAddress(),
        cdata,
        memo: toUtf8Bytes("setOwnerRespect1")
      };
      const pId = propId(msg);

      await expectVoteCounted(orec, token, pId, accounts[1], VoteType.Yes);

      await time.increase(voteLen + vetoLen);

      await expect(orec.execute(msg)).to.emit(orec, "Executed");

      expect(await orec.respectContract()).to.be.equal(newTokenAddress);

      // Test proposals with new token as ownerRespect
      const prop = await buildMintProp(accounts[16].address, 10);
      await expectVoteCounted(orec, newToken, prop.id, accounts[16], VoteType.Yes);
      await time.increase(voteLen + vetoLen);
      await expect(orec.execute(prop.msg)).to.not.be.reverted;

      expect(await token.balanceOf(accounts[16].address)).to.be.equal(10);
    });
    it("should not allow anyone else to change respect contract")
    it("should not allow anyone else to change voteLen");
    it("should allow itself to change vetoLen")
    it("should not allow anyone else to change vetoLen")
    it("should allow tself to change minWeight")
    it("should not allow anyone else to change minWeight")
    it("should allow itself to change maxLiveVotes")
    it("should not allow anyone else to change maxLiveVotes")
  });
});