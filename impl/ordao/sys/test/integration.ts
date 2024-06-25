import chai, { expect } from "chai";
import { time, mine } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import { BreakoutResult, DecodedProposal, RespectBreakout, Proposal, RespectAccountRequest, RespectAccount, Tick, CustomSignal, ProposalMsgFull, PropOfPropType, isPropMsgFull, zProposalMsgFull, toPropMsgFull, CustomSignalRequest, RespectBreakoutRequest, VoteRequest, VoteWithProp } from "ortypes/orclient.js";
import { TxFailed, ORClient, RemoteOrnode, defaultConfig } from "orclient";
import { EthAddress, ExecStatus, PropType, Stage, VoteStatus, VoteType, zProposedMsg } from "ortypes";
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers.js";
import { Signer } from "ethers";
import {
  Respect1155,
  WEEK_1, DAY_6, DAY_1, HOUR_1,
  IORNode,
  propId
} from "ortypes";
import { packTokenId } from "ortypes/respect1155.js";
import { ConfigWithOrnode, ORContext } from "ortypes/orContext.js";
import { sleep } from "ts-utils/dist/index.js";
import {
  FractalRespect,
  FractalRespect__factory as FractalRespectFactory
} from "op-fractal-sc";
import {
  OrecContract as Orec,
  OrecFactory,
  MessageStruct
} from "ortypes/orec.js";
import { DeployState, Deployment, SerializableState as DeploymentState } from "../src/deployment.js";

if (!process.env.DEBUGLOG) {
  console.debug = () => {};
}

// stack trace line number offset: 69

chai.config.truncateThreshold = 0;
chai.config.includeStack = true;

async function confirm<T>(
  promise: Promise<T>,
  increaseTimeS: number = 2
): Promise<T> {
  // await time.increase(increaseTimeS);  
  // await time.increase(increaseTimeS);
  // await time.increase(increaseTimeS);
  return await promise;
}

describe("orclient", function() {
  let cl: ORClient;
  let ornode: IORNode;
  let addrs: EthAddress[] = []
  let oldRespect: FractalRespect;
  let newRespect: Respect1155.Contract;
  let orec: Orec;
  let signers: HardhatEthersSigner[];
  let resultProps: Proposal[] = [];
  let mintProps: Proposal[] = [];
  let tickProps: Proposal[] = [];
  let signalProps: Proposal[] = [];
  let nonRespectedAccs: EthAddress[];
  let groupRes: BreakoutResult[];
  let mintReqs: RespectAccountRequest[];
  let threshold: number;
  let st: DeployState

  before("launch eth test network", async function() {
    const d = await Deployment.devConnect("./tmp/dev-deployment.json");
    st = d.state;

    signers = await hre.ethers.getSigners();
    addrs = st.addrs;
    nonRespectedAccs = st.nonRespectedAccs;
    threshold = st.voteThreshold;

    oldRespect = st.oldRespect;
    orec = st.orec;
    newRespect = st.newRespect;
  });
  
  before("create ORNode", async function() {
    ornode = new RemoteOrnode("http://localhost:8090");
  });

  before("create ORClient", async function() {
    const ctx = new ORContext<ConfigWithOrnode>({ orec, newRespect, oldRespect, ornode });
    cl = new ORClient(ctx, { ...defaultConfig, propResubmitInterval: 1000 });
  })

  function expectDecoded<T extends PropType>(
    propTypeStr: T,
    prop: Proposal
  ): PropOfPropType<T> {
    expect(prop.decoded).to.not.be.undefined;
    const decoded = prop.decoded as DecodedProposal;
    expect(decoded.propType).to.be.equal(propTypeStr);
    const d = decoded as PropOfPropType<T>
    return d;
  }

  function expectRespectBreakout(prop: Proposal) {
    return expectDecoded("respectBreakout", prop);
  }

  function expectRespectAccount(prop: Proposal) {
    return expectDecoded("respectAccount", prop);
  }

  function expectTick(prop: Proposal) {
    return expectDecoded("tick", prop);
  }

  function expectCustomSignal(prop: Proposal) {
    return expectDecoded("customSignal", prop);
  }

  async function expectInitPropValues(prop: ProposalMsgFull | Proposal) {
    const propFull = toPropMsgFull(prop);

    expect(prop.addr).to.be.equal(await newRespect.getAddress());

    const pId = propId({
      addr: propFull.addr,
      cdata: propFull.cdata,
      memo: propFull.memo
    });

    expect(prop.id).to.be.equal(pId);
    expectAproxNow(prop.createTime);
    expect(prop.yesWeight).to.be.equal(prop.noWeight).to.be.equal(0)
    expect(prop.yesWeight).to.be.equal(prop.noWeight).to.be.equal(0)
    expect(prop.status).to.be.equal(ExecStatus.NotExecuted);
    expect(prop.stage).to.be.equal(Stage.Voting);
    expect(prop.voteStatus).to.be.equal(VoteStatus.Failing); // Because there are no votes yet
  }

  async function expectInitOnChainProp(prop: ProposalMsgFull | Proposal) {
    const propFull = toPropMsgFull(prop);

    const pId = propId({
      addr: propFull.addr,
      cdata: propFull.cdata,
      memo: propFull.memo
    });

    const onchainProp = await orec.proposals(pId);

    expect(onchainProp.createTime).to.be.equal(prop.createTime);
    expect(onchainProp.yesWeight).to.be.equal(prop.yesWeight);
    expect(onchainProp.noWeight).to.be.equal(prop.noWeight);
    expect(onchainProp.status).to.be.equal(ExecStatus.NotExecuted);
  }

  async function expectAproxNow(date: Date, maxDiffSec = 60) {
    const now = await time.latest();
    // console.log("now: ", now, "date: ", (date.getTime() / 1000));
    const diff = now - (date.getTime() / 1000);
    // console.log("diff: ", diff);
    expect(Math.abs(diff) < maxDiffSec).to.be.true;
  }

  describe("submitting breakout room results", function() {
    before("submit some results", async function() {
      console.debug("test debug");

      groupRes = [
        {
          groupNum: 1,
          rankings: [
            addrs[0], addrs[1], addrs[2], addrs[3], addrs[4], addrs[5]
          ]
        },
        {
          groupNum: 2,
          rankings: [
            addrs[6], addrs[7], addrs[8], addrs[9], addrs[10]
          ]
        },
        {
          groupNum: 3,
          rankings: [
            addrs[12], addrs[13], addrs[14], addrs[15], addrs[16] 
          ]
        }
      ]

      let result = await confirm(cl.submitBreakoutResult(groupRes[2]));
      resultProps.push(result.proposal);
      result = await confirm(cl.submitBreakoutResult(groupRes[1]));
      resultProps.push(result.proposal);
      result = await confirm(cl.submitBreakoutResult(groupRes[0]));
      resultProps.push(result.proposal);
    });

    describe("lsProposals", function() {
      let resultProps: Proposal[];

      before("call lsProposals", async function() {
        resultProps = await cl.lsProposals();
      });
      it("should return submitted proposals ordered from newest to oldest", async function() {
        for (const [index, prop] of resultProps.entries()) {
          const rb = expectRespectBreakout(prop);

          expect(rb.meetingNum).to.be.equal(1);
          expect(rb.groupNum).to.be.equal(groupRes[index].groupNum, "wrong group num");
          expect(rb.rankings).to.be.deep.equal(groupRes[index].rankings);
        }
      });

      it("should return proposals with proposal ids consistent with the onchain message proposed", async function() {
        for (const [index, prop] of resultProps.entries()) {
          const rb = expectRespectBreakout(prop);

          const propFull = zProposedMsg.parse(prop);

          const msg: MessageStruct = { 
            addr: propFull.addr,
            cdata: propFull.cdata,
            memo: propFull.memo
          };

          const pId = propId(msg);
          expect(prop.id).to.be.equal(pId);
        }
      });
      it("should have new respect contract as the address of proposed message", async function() {
        for (const [index, prop] of resultProps.entries()) {
          expect(prop.addr).to.be.equal(await newRespect.getAddress());
        }
      });
    })
    it("should have created proposals onchain", async function () {
      for (const [index, prop] of resultProps.entries()) {
        const rb = expectRespectBreakout(prop);

        const fullProp = zProposedMsg.parse(prop);

        const msg: MessageStruct = { 
          addr: fullProp.addr,
          cdata: fullProp.cdata,
          memo: fullProp.memo
        };

        const pId = propId(msg);

        const onChainProp = await orec.proposals(pId);

        expect(onChainProp.createTime).to.be.equal(prop.createTime.getTime() / 1000);
        await expectAproxNow(prop.createTime);
        expect(onChainProp.yesWeight).to.be.equal(prop.yesWeight).to.be.equal(0);
        expect(onChainProp.noWeight).to.be.equal(prop.noWeight).to.be.equal(0);
        expect(onChainProp.status).to.be.equal(prop.status).to.be.equal(ExecStatus.NotExecuted);
      }
    });

    describe("getProposal", function() {
      it("should return proposals from lsProposals by id", async function() {
        for (const [index, prop] of resultProps.entries()) {
          const prop2 = await cl.getProposal(prop.id);
          expect(prop2).to.deep.equal(prop);
        }
      })
    });

    // it("should have created new proposals according to ornode")
  });

  describe("proposing to respect an individual account", function() {
    before("create proposals by calling proposeRespectTo", async function() {
      mintReqs = [
        {
          account: addrs[0],
          value: 10n,
          title: "Some work 1",
          reason: "Did some work 1"
        },
        {
          account: addrs[1],
          value: 15n,
          title: "some work 2",
          reason: "did some work 2"
        }
      ];

      const p1 = await confirm(cl.proposeRespectTo(mintReqs[0]));
      mintProps.push(p1.proposal);
      const p2 = await confirm(cl.proposeRespectTo(mintReqs[1]));
      mintProps.push(p2.proposal);
    });

    it("should have returned expected mint proposals", async function() {
      // Take top two proposals
      
      for (const [index, prop] of mintProps.entries()) {
        const req = mintReqs[index];

        expect(prop.addr).to.be.equal(await newRespect.getAddress(), "wrong proposal address");

        expectInitPropValues(prop);

        const ra = expectRespectAccount(prop);
        expect(ra.meetingNum).to.be.equal(1);
        expect(ra.account).to.be.equal(req.account, "wrong respect receiver");
        expect(ra.reason).to.be.equal(req.reason);
        expect(ra.title).to.be.equal(req.title);
        expect(ra.value).to.be.equal(req.value);
      }

    });

    it("should have created new proposals onchain", async function() {
      // Take top two proposals
      for (const [index, prop] of mintProps.entries()) {
        expectInitOnChainProp(prop);
      }
    })
  });

  describe("proposing a tick (to increment meeting number)", function() {
    before("create proposal by calling proposeTick", async function() {
      tickProps.push((await confirm(cl.proposeTick())).proposal);
      tickProps.push((await confirm(cl.proposeTick({ data: "0x11" }))).proposal);
    });

    it("should return period number of 0 before the tick is executed", async function() {
      expect(await cl.getPeriodNum()).to.be.equal(0);
      expect(await cl.getNextMeetingNum()).to.be.equal(1);
    });

    it("should have returned expected tick proposals", async function() {
      // Take top two proposals
      expectInitPropValues(tickProps[0]);
      const t1 = expectTick(tickProps[0]);
      expect(t1.data).to.be.equal("0x01")

      expectInitPropValues(tickProps[1]);
      const t2 = expectTick(tickProps[1]);
      expect(t2.data).to.be.equal("0x11");
    });

    it("should have created new proposal onchain", async function() {
      // Take top two proposals
      for (const [index, prop] of tickProps.entries()) {
        expectInitOnChainProp(prop);
      }
    })
  });
  describe("proposing a custom signal", function() {
    const sreq1: CustomSignalRequest = {
      signalType: 3,
      data: "0x01",
      link: "https://someaddr.io"
    };
    const sreq2: CustomSignalRequest = {
      signalType: 4,
      data: "0x02",
      link: "https://someaddr2.io"
    }; 
    before("create proposal by calling proposeSignal", async function() {
      signalProps.push((await confirm(cl.proposeCustomSignal(sreq1))).proposal);
      signalProps.push((await confirm(cl.proposeCustomSignal(sreq2))).proposal);
    });

    it("should have returned expected signal proposals", async function() {
      // Take top two proposals
      expectInitPropValues(signalProps[0]);
      const s1 = expectCustomSignal(signalProps[0]);
      expect(s1.data).to.be.equal(sreq1.data);
      expect(s1.link).to.be.equal(sreq1.link);
      expect(s1.signalType).to.be.equal(sreq1.signalType);

      expectInitPropValues(signalProps[1]);
      const s2 = expectCustomSignal(signalProps[1]);
      expect(s2.data).to.be.equal(sreq2.data);
      expect(s2.link).to.be.equal(sreq2.link);
      expect(s2.signalType).to.be.equal(sreq2.signalType);
    });

    it("should have created new proposal onchain", async function() {
      // Take top two proposals
      for (const [index, prop] of signalProps.entries()) {
        expectInitOnChainProp(prop);
      }
    })
  })
  describe("voting for existing proposal", function() {
    it("should vote YES successfully with respect holder account", async function() {
      ///// Proposal 1 ///
      // vote 1
      const signer = signers[10];
      expect(nonRespectedAccs).to.not.include(signer.address);
      const voter = cl.connect(signer);
      await expect(voter.vote(resultProps[0].id, VoteType.Yes, "")).to.not.be.rejected;

      await time.increase(HOUR_1);

      // vote 2
      const signer2 = signers[11];
      expect(nonRespectedAccs).to.not.include(signer2.address);
      const voter2 = cl.connect(signer2);
      await expect(voter2.vote(resultProps[0].id, VoteType.Yes, "")).to.not.be.rejected;

      await time.increase(HOUR_1);

      const signer3 = signers[6];
      expect(nonRespectedAccs).to.not.include(signer3.address);
      const voter3 = cl.connect(signer3);
      await expect(voter3.vote(resultProps[0].id, VoteType.Yes, "")).to.not.be.rejected;

      const signer4 = signers[12];
      expect(nonRespectedAccs).to.not.include(signer4.address);
      const voter4 = cl.connect(signer4);
      await expect(voter4.vote(resultProps[0].id, VoteType.Yes, "")).to.not.be.rejected;

      //// Proposal 2 ///
      // vote 2
      await expect(voter2.vote(mintProps[0].id, VoteType.Yes, "")).to.not.be.rejected;

      await time.increase(HOUR_1);

      //// Proposal 3 ///
      await expect(voter.vote(tickProps[0].id, VoteType.Yes, "")).to.not.be.rejected;
    });
    it("should vote YES successfully with account which does not have any respect", async function() {
      const signer = signers[9];
      expect(nonRespectedAccs).to.include(signer.address);
      const voter = cl.connect(signer);
      await expect(voter.vote(resultProps[0].id, VoteType.Yes, "")).to.not.be.rejected;
      await expect(voter.vote(mintProps[0].id, VoteType.Yes, "some memo")).to.not.be.rejected;
      await expect(voter.vote(tickProps[0].id, VoteType.Yes, "some memo")).to.not.be.rejected;
    });
    it("should update yesWeight", async function() {
      const rWeight1 = await oldRespect.balanceOf(addrs[10]);
      const rWeight2 = await oldRespect.balanceOf(addrs[11]);
      const rWeight3 = await oldRespect.balanceOf(addrs[6]);
      const rWeight4 = await oldRespect.balanceOf(addrs[12]);
      const rWeight = rWeight1 + rWeight2 + rWeight3 + rWeight4;

      const updatedResProp = await cl.getProposal(resultProps[0].id);
      expect(updatedResProp.yesWeight).to.be.equal(rWeight);
      expect(updatedResProp.noWeight).to.be.equal(0);

      const updatedMintProp = await cl.getProposal(mintProps[0].id);
      expect(updatedMintProp.yesWeight).to.be.equal(rWeight2);
      expect(updatedMintProp.noWeight).to.be.equal(0);

      const updatedTickProp = await cl.getProposal(tickProps[0].id);
      expect(updatedTickProp.yesWeight).to.be.equal(rWeight1);
      expect(updatedTickProp.noWeight).to.be.equal(0);
    });
    it("should update onchain yesWeight", async function() {
      const rWeight1 = await oldRespect.balanceOf(addrs[10]);
      const rWeight2 = await oldRespect.balanceOf(addrs[11]);
      const rWeight3 = await oldRespect.balanceOf(addrs[6]);
      const rWeight4 = await oldRespect.balanceOf(addrs[12]);
      const rWeight = rWeight1 + rWeight2 + rWeight3 + rWeight4;

      const resPropState = await orec.proposals(resultProps[0].id);
      expect(resPropState.yesWeight).to.be.equal(rWeight);
      expect(resPropState.noWeight).to.be.equal(0);

      const mintPropState = await orec.proposals(mintProps[0].id);
      expect(mintPropState.yesWeight).to.be.equal(rWeight2);
      expect(mintPropState.noWeight).to.be.equal(0);

      const tickPropState = await orec.proposals(tickProps[0].id);
      expect(tickPropState.yesWeight).to.be.equal(rWeight1);
      expect(tickPropState.noWeight).to.be.equal(0);
    })

    it("should vote NO successfully with respect holder account", async function() {
      ///// Proposal 1 ///
      // vote 1
      const signer = signers[7];
      expect(nonRespectedAccs).to.not.include(signer.address);
      const voter = cl.connect(signers[7]);
      await expect(voter.vote(resultProps[0].id, VoteType.No, "")).to.not.be.rejected;

      await time.increase(HOUR_1);

      // vote 2
      const signer2 = signers[5];
      expect(nonRespectedAccs).to.not.include(signer2.address);
      const voter2 = cl.connect(signers[5]);
      await expect(voter2.vote(resultProps[0].id, VoteType.No)).to.not.be.rejected;

      await time.increase(HOUR_1);

      //// Proposal 2 ///
      // vote 2
      await expect(voter2.vote(mintProps[0].id, VoteType.No)).to.not.be.rejected;

      await time.increase(HOUR_1);

      //// Proposal 3 ///
      await expect(voter.vote(tickProps[0].id, VoteType.No)).to.not.be.rejected;

    });
    it("should vote NO successfully with account which does not have any respect", async function() {
      const signer = signers[9];
      expect(nonRespectedAccs).to.include(signer.address);
      const voter = cl.connect(signers[9]);
      await expect(voter.vote(resultProps[0].id, VoteType.No, "")).to.not.be.rejected;
      await expect(voter.vote(mintProps[0].id, VoteType.No, "some memo")).to.not.be.rejected;
      await expect(voter.vote(tickProps[0].id, VoteType.No, "some memo")).to.not.be.rejected;

      await time.increase(HOUR_1);
    });
    it("should update noWeight", async function() {
      const rWeight1 = await oldRespect.balanceOf(addrs[7]);
      const rWeight2 = await oldRespect.balanceOf(addrs[5]);
      const rWeight = rWeight1 + rWeight2;

      const yesRWeight1 = await oldRespect.balanceOf(addrs[10]);
      const yesRWeight2 = await oldRespect.balanceOf(addrs[11]);
      const yesRWeight3 = await oldRespect.balanceOf(addrs[6]);
      const yesRWeight4 = await oldRespect.balanceOf(addrs[12]);
      const yesRWeight = yesRWeight1 + yesRWeight2 + yesRWeight3 + yesRWeight4;

      const updatedResProp = await cl.getProposal(resultProps[0].id);
      expect(updatedResProp.yesWeight).to.be.equal(yesRWeight);
      expect(updatedResProp.noWeight).to.be.equal(rWeight);

      const updatedMintProp = await cl.getProposal(mintProps[0].id);
      expect(updatedMintProp.yesWeight).to.be.equal(yesRWeight2);
      expect(updatedMintProp.noWeight).to.be.equal(rWeight2);

      const updatedTickProp = await cl.getProposal(tickProps[0].id);
      expect(updatedTickProp.yesWeight).to.be.equal(yesRWeight1);
      expect(updatedTickProp.noWeight).to.be.equal(rWeight1);
    });
    it("should update onchain noWeight", async function() {
      const rWeight1 = await oldRespect.balanceOf(addrs[7]);
      const rWeight2 = await oldRespect.balanceOf(addrs[5]);
      const rWeight = rWeight1 + rWeight2;

      const yesRWeight1 = await oldRespect.balanceOf(addrs[10]);
      const yesRWeight2 = await oldRespect.balanceOf(addrs[11]);
      const yesRWeight3 = await oldRespect.balanceOf(addrs[6]);
      const yesRWeight4 = await oldRespect.balanceOf(addrs[12]);
      const yesRWeight = yesRWeight1 + yesRWeight2 + yesRWeight3 + yesRWeight4;

      const resPropState = await orec.proposals(resultProps[0].id);
      expect(resPropState.yesWeight).to.be.equal(yesRWeight);
      expect(resPropState.noWeight).to.be.equal(rWeight);

      const mintPropState = await orec.proposals(mintProps[0].id);
      expect(mintPropState.yesWeight).to.be.equal(yesRWeight2);
      expect(mintPropState.noWeight).to.be.equal(rWeight2);

      const tickPropState = await orec.proposals(tickProps[0].id);
      expect(tickPropState.yesWeight).to.be.equal(yesRWeight1);
      expect(tickPropState.noWeight).to.be.equal(rWeight1);
    })

    it("should allow switching vote to no", async function() {
      // Let's switch vote for first result submission with signer[10]
      const voter = cl.connect(signers[10]);
      await expect(voter.vote(resultProps[0].id, VoteType.No, "")).to.not.be.rejected;

      // Check if vote weights were updated...
      const rWeight1 = await oldRespect.balanceOf(addrs[7]);
      const rWeight2 = await oldRespect.balanceOf(addrs[5]);
      const rWeight3 = await oldRespect.balanceOf(addrs[10]);
      const rWeight = rWeight1 + rWeight2 + rWeight3;

      const yesRWeight2 = await oldRespect.balanceOf(addrs[11]);
      const yesRWeight3 = await oldRespect.balanceOf(addrs[6]);
      const yesRWeight4 = await oldRespect.balanceOf(addrs[12]);
      const yesRWeight = yesRWeight2 + yesRWeight3 + yesRWeight4;

      // ...according to orclient...
      const updatedResProp = await cl.getProposal(resultProps[0].id);
      expect(updatedResProp.yesWeight).to.be.equal(yesRWeight);
      expect(updatedResProp.noWeight).to.be.equal(rWeight);

      // ...according to onchain contract...
      const resPropState = await orec.proposals(resultProps[0].id);
      expect(resPropState.yesWeight).to.be.equal(yesRWeight);
      expect(resPropState.noWeight).to.be.equal(rWeight);
    })

    it("should throw if attempting to vote YES after voting time ended", async function() {
      expect(await orec.isVotePeriod(resultProps[0].id)).to.be.true;
      await time.increase(DAY_1 + 1n);
      expect(await orec.isVotePeriod(resultProps[0].id)).to.be.false;

      const voter = cl.connect(signers[14]);

      console.log(`voting for: ${resultProps[0].id}`);
      await expect(voter.vote(resultProps[0].id, VoteType.Yes, ""))
        .to.eventually.be.rejectedWith(TxFailed)
          .that.has.property('decodedError')
            .that.has.property('name', 'VotePeriodOver');
    });
    it("should vote NO successfully during veto time", async function() {
      const id = resultProps[0].id;
      expect(await orec.isVetoPeriod(id)).to.be.true;
      expect(await orec.getVoteStatus(id))
        .to.be.equal(
          VoteStatus.Passing,
          `${(await orec.proposals(id)).yesWeight} / ${(await orec.proposals(id)).noWeight}`
        );

      // Save current weight
      const resProp = await cl.getProposal(resultProps[0].id);

      expect(nonRespectedAccs).to.not.include(signers[14].address);
      const voter = cl.connect(signers[14]);

      await expect(voter.vote(resultProps[0].id, VoteType.No)).to.not.be.rejected;

      const newNoWeight = resProp.noWeight + await oldRespect.balanceOf(signers[14].address);

      const updatedResProp = await cl.getProposal(resultProps[0].id);
      expect(updatedResProp.noWeight).to.be.equal(newNoWeight);

      const propState = await orec.proposals(resultProps[0].id);
      expect(propState.noWeight).to.be.equal(newNoWeight);
    });

    it("should throw if voting NO or YES after veto time", async function() {
      await time.increase(DAY_6);

      const voter = cl.connect(signers[6]);

      await expect(voter.vote(resultProps[1].id, VoteType.Yes, ""))
        .to.eventually.be.rejectedWith(TxFailed)
          .that.has.property('decodedError')
            .that.has.property('name', "VotePeriodOver");
      await expect(voter.vote(resultProps[1].id, VoteType.No, ""))
        .to.eventually.be.rejectedWith(TxFailed)
          .that.has.property('decodedError')
            .that.has.property('name', 'ProposalVoteInactive');
    });
  });
  // TODO: describe creating new proposals
  // TODO: describe submitting breakout results multiple times instead of submitting once and then voting
  describe("failing a proposal", function() {
    let groupRes: RespectBreakoutRequest;
    let mintReq: RespectAccountRequest;

    before("create new proposals", async function() {
      // These requests are identical to the ones already submitted except for metadata
      // So this is also a test for how to resolve conflicts...
      // Without metadata you are getting an error that VotePeriodOver...
      groupRes = {
        groupNum: 3,
        rankings: [
          addrs[12], addrs[13], addrs[14], addrs[15], addrs[16] 
        ],
        metadata: {
          propTitle: "2nd attempt"
        }
      }
      mintReq = {
        account: addrs[0],
        value: 10n,
        title: "Some work 1",
        reason: "Did some work 1",
        metadata: {
          propTitle: "2nd attempt"
        }
      };

      resultProps = [];
      resultProps.push((await confirm(cl.submitBreakoutResult(groupRes, { memo: "smth"}))).proposal)

      mintProps = [];
      mintProps.push((await confirm(cl.proposeRespectTo(mintReq, { memo: "aa"}))).proposal);

      tickProps = [];
      tickProps.push((await confirm(cl.proposeTick({ metadata: { propDescription: "B" }}))).proposal);
    });

    before("vote on proposals", async function() {
      const voter = cl.connect(signers[10]);

      await expect(voter.vote(resultProps[0].id, VoteType.Yes, "voting yes")).to.not.be.rejected;
      await expect(voter.vote(tickProps[0].id, VoteType.Yes, "y1")).to.not.be.rejected;
      
      const noVoter = cl.connect(signers[2]);
      expect(await oldRespect.balanceOf(addrs[2])).to.be.not.lessThan(await oldRespect.balanceOf(addrs[10]));
      await expect(noVoter.vote(resultProps[0].id, VoteType.No, "voting no"));
    })

    it('should return status "failing" for proposal, which does not have enough yesWeight', async function() {
      const mintProp = await cl.getProposal(mintProps[0].id);
      expect(mintProp.voteStatus).to.be.equal(VoteStatus.Failing);

      const resProp = await cl.getProposal(resultProps[0].id);
      expect(resProp.voteStatus).to.be.equal(VoteStatus.Failing);
    })

    it('should return status "failed" for proposal which does not have enough yesWeight after vote time ended', async function() {
      await time.increase(DAY_1 * 2n);

      const mintProp = await cl.getProposal(mintProps[0].id);
      expect(mintProp.voteStatus).to.be.equal(VoteStatus.Failed);

      const resProp = await cl.getProposal(resultProps[0].id);
      expect(resProp.voteStatus).to.be.equal(VoteStatus.Failed);
    })
    it('should return status "failed" for proposal which does not have enough yesWeight after veto time ended', async function() {
      await time.increase(DAY_6);

      const mintProp = await cl.getProposal(mintProps[0].id);
      expect(mintProp.voteStatus).to.be.equal(VoteStatus.Failed);

      const resProp = await cl.getProposal(resultProps[0].id);
      expect(resProp.voteStatus).to.be.equal(VoteStatus.Failed);
    });

    it("should throw if trying to execute a failed proposal", async function() {
      await expect(cl.execute(mintProps[0].id))
        .to.eventually.be.rejectedWith(TxFailed)
          .that.has.property("decodedError")
            .that.has.property("name", "ProposalNotPassed");
      await expect(cl.execute(resultProps[0].id))
        .to.eventually.be.rejectedWith(TxFailed)
          .that.has.property("decodedError")
            .that.has.property("name", "ProposalNotPassed");
    })
  });
  describe("vetoing a proposal", function() {})
  describe("passing a proposal", function() {
    let groupRes: RespectBreakoutRequest;
    let mintReq: RespectAccountRequest;

    before("create new proposals", async function() {
      // These requests are identical to the ones already submitted except for metadata
      // So this is also a test for how to resolve conflicts...
      // Without metadata you are getting an error that VotePeriodOver...
      groupRes = {
        groupNum: 3,
        rankings: [
          addrs[12], addrs[13], addrs[14], addrs[15], addrs[16] 
        ],
        metadata: {
          propTitle: "3rd attempt"
        }
      }
      mintReq = {
        account: addrs[0],
        value: 10n,
        title: "Some work 1",
        reason: "Did some work 1",
        metadata: {
          propTitle: "3rd attempt"
        }
      };
      resultProps = [];
      resultProps.push((await confirm(cl.submitBreakoutResult(groupRes))).proposal)

      mintProps = [];
      mintProps.push((await confirm(cl.proposeRespectTo(mintReq))).proposal);

      tickProps = [];
      tickProps.push((await confirm(cl.proposeTick({ metadata: { propDescription: "C" }}))).proposal);
    });

    before("vote on proposals", async function() {
      const voter = cl.connect(signers[10]);
      const voter2 = cl.connect(signers[14]);

      await expect(voter.vote(resultProps[0].id, VoteType.Yes, "voting yes")).to.not.be.rejected;
      await expect(voter.vote(tickProps[0].id, VoteType.Yes, "y1")).to.not.be.rejected;
      await expect(voter.vote(mintProps[0].id, VoteType.Yes, "")).to.not.be.rejected;
      await expect(voter2.vote(tickProps[0].id, VoteType.Yes)).to.not.be.rejected;
      await expect(voter2.vote(mintProps[0].id, VoteType.Yes)).to.not.be.rejected;
      
      const noVoter = cl.connect(signers[2]);
      const noWeight = await oldRespect.balanceOf(addrs[2]);
      expect(noWeight).to.be.not.lessThan(await oldRespect.balanceOf(addrs[10]));
      await expect(noVoter.vote(resultProps[0].id, VoteType.No, "voting no"));

      const yesVoter2 = cl.connect(signers[14]);
      const yesVoter3 = cl.connect(signers[1]);
      const totalYesVotes =
        await oldRespect.balanceOf(addrs[14])
        + await oldRespect.balanceOf(addrs[1])
        + await oldRespect.balanceOf(addrs[10]);
      expect(totalYesVotes).to.be.greaterThan(noWeight * 2n);

      await expect(yesVoter2.vote(resultProps[0].id, VoteType.Yes, "")).to.not.be.rejected;
      await expect(yesVoter3.vote(resultProps[0].id, VoteType.Yes, "")).to.not.be.rejected;
    })

    it('should return status "passing" for proposal, which does have enough weight', async function() {
      const mintPropSum = await oldRespect.balanceOf(addrs[10]) + await oldRespect.balanceOf(addrs[14]);
      expect(mintPropSum).to.be.greaterThanOrEqual(threshold);

      const mintProp = await cl.getProposal(mintProps[0].id);
      expect(mintProp.voteStatus).to.be.equal(VoteStatus.Passing);

      const resProp = await cl.getProposal(resultProps[0].id);
      expect(resProp.voteStatus).to.be.equal(VoteStatus.Passing);

      const updatedTickProp = await cl.getProposal(tickProps[0].id)
      expect(updatedTickProp.voteStatus).to.be.equal(VoteStatus.Passing);
    })

    it('should return status "passing" for proposal which does have enough yesWeight during veto time', async function() {
      await time.increase(DAY_1 * 2n);

      const mintProp = await cl.getProposal(mintProps[0].id);
      expect(mintProp.voteStatus).to.be.equal(VoteStatus.Passing);

      const resProp = await cl.getProposal(resultProps[0].id);
      expect(resProp.voteStatus).to.be.equal(VoteStatus.Passing);

      const updatedTickProp = await cl.getProposal(tickProps[0].id)
      expect(updatedTickProp.voteStatus).to.be.equal(VoteStatus.Passing);
    })

    it('should return status "passed" for proposal which does have enough yesWeight after veto time ended', async function() {
      await time.increase(DAY_6);

      const mintProp = await cl.getProposal(mintProps[0].id);
      expect(mintProp.voteStatus).to.be.equal(VoteStatus.Passed);

      const resProp = await cl.getProposal(resultProps[0].id);
      expect(resProp.voteStatus).to.be.equal(VoteStatus.Passed);

      const updatedTickProp = await cl.getProposal(tickProps[0].id)
      expect(updatedTickProp.voteStatus).to.be.equal(VoteStatus.Passed);
    });

  })
  describe("executing a passed proposal", function() {
    describe("respecting breakout group", function() {
      it("should execute successfully", async function() {
        await expect(cl.execute(resultProps[0].id)).to.not.be.rejected;
      })
      it("should have distributed appropriate amounts of respect to participants of a group", async function() {
        // groupRes[2]
        // {
        //   groupNum: 3,
        //   rankings: [
        //     addrs[12], addrs[13], addrs[14], addrs[15], addrs[16], ZeroAddress
        //   ]

        expect(await newRespect.respectOf(addrs[12])).to.be.equal(55n);
        expect(await newRespect.respectOf(addrs[13])).to.be.equal(34n);
        expect(await newRespect.respectOf(addrs[14])).to.be.equal(21n);
        expect(await newRespect.respectOf(addrs[15])).to.be.equal(13n);
        expect(await newRespect.respectOf(addrs[16])).to.be.equal(8n);
      });
    })
    describe("respecting individual account", function() {
      it("should execute successfully", async function() {
        await expect(cl.execute(mintProps[0].id)).to.not.be.rejected;
      });
      it("should mint a respect token of proposed value for the proposed account", async function() {
        await time.increase(1);
        expect(await newRespect.respectOf(addrs[0])).to.be.equal(10, "wrong balance");

        const decodedProp = expectRespectAccount(mintProps[0]);
        const tokenId = packTokenId({
          mintType: decodedProp.mintType,
          periodNumber: decodedProp.meetingNum - 1,
          owner: decodedProp.account
        });

        expect(await newRespect.ownerOf(tokenId)).to.be.equal(addrs[0]);
        expect(await newRespect.valueOfToken(tokenId)).to.be.equal(10, "wrong value of token");
        expect(await newRespect.balanceOf(mintReqs[0].account, tokenId)).to.be.equal(1);
      })
    })
    describe("tick (incrementing period / meeting number)", function() {
      it("should execute successfully", async function() {
        await expect(cl.execute(tickProps[0].id)).to.not.be.rejected;
        // Some time for ornode to catch up
        await time.increase(1);
        await time.increase(1);
        await time.increase(1);
        await sleep(1000);
      });
      it("should increment nextMeetingNumber", async function() {
        expect(await cl.getNextMeetingNum()).to.be.equal(2);
      });
      it("should increment periodNumber", async function() {
        expect(await cl.getPeriodNum()).to.be.equal(1);
      })
      it("should increment lastMeetingNumber", async function() {
        expect(await cl.getLastMeetingNum()).to.be.equal(1);
      })
    })
    describe("custom signal", function() {
      // TODO
      it("should execute successfully");
      it("should emit a Signal event with proposed data")
    })
  });
  // TODO:
  describe("proposing to burn respect of an individual account", function() {})
  describe("burning respect of individual account", function() {});

  // after("shutdown hardhat local testnet", async function() {
  //   await lt.shutDown();
  // })
});