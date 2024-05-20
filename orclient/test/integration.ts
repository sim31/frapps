import chai, { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import ORClient, { BreakoutResult, ORNode, EthAddress, DecodedProposal, RespectBreakout, Proposal, RespectAccountRequest, Stage, VoteStatus, RespectAccount, Tick, CustomSignal } from "../src/orclient.js";
import hre, { run } from "hardhat";
import { ZeroAddress, hexlify, Signer } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers.js";
import orecFactory from "orec/typechain-types/factories/contracts/Orec__factory.js";
const { Orec__factory: OrecFactory } = orecFactory;
import orecUtils from "orec/utils/index.js";
const { WEEK_1, DAY_6, DAY_1, HOUR_1, propId, ExecStatus, VoteType } = orecUtils;
import { Orec } from "orec/typechain-types/contracts/Orec.js";
import FRF from "op-fractal-sc/typechain-types/factories/contracts/FractalRespect__factory.js";
const { FractalRespect__factory: FrRespectFactory } = FRF;
import { FractalRespect } from "op-fractal-sc/typechain-types/contracts/FractalRespect.js";
import RF from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
const { Respect1155__factory: RespectFactory } = RF;
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";

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
  let resultProps: Proposal[];
  let proposals: Proposal[];

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

  const mintReqs: RespectAccountRequest[] = [
    {
      account: addrs[0],
      value: 10,
      title: "Some work 1",
      reason: "Did some work 1"
    },
    {
      account: addrs[1],
      value: 15,
      title: "some work 2",
      reason: "did some work 2"
    }
  ];

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

  before("deploy orec", async function() {
    const signer = signers[0];
    const orecFactory = new OrecFactory(signer);

    orec = await orecFactory.deploy(
      await oldRespect.getAddress(),
      DAY_6, DAY_1, 21
    );
  });

  before("deploy new respect contract", async function() {
    const respectFactory = new RespectFactory(signers[0]);

    newRespect = await respectFactory.deploy(orec, "https://tf.io");
  });

  before("create ORNode", async function() {
    ornode = {};
  })

  before("create ORClient", async function() {
    cl = await ORClient.createORClient({ ornode, eth: ethUrl });
  })

  function expectDecoded<T extends DecodedProposal>(
    propTypeStr: string,
    prop: Proposal
  ): T {
    expect(prop.decoded).to.not.be.undefined;
    const decoded = prop.decoded as DecodedProposal;
    expect(decoded.propType).to.be.equal(propTypeStr);
    const d = decoded as T;
    return d;
  }

  function expectRespectBreakout(prop: Proposal) {
    return expectDecoded<RespectBreakout>("respectBreakout", prop);
  }

  function expectRespectAccount(prop: Proposal) {
    return expectDecoded<RespectAccount>("respectAccount", prop);
  }

  function expectTick(prop: Proposal) {
    return expectDecoded<Tick>("tick", prop);
  }

  function expectCustomSignal(prop: Proposal) {
    return expectDecoded<CustomSignal>("customSignal", prop);
  }

  async function expectInitPropValues(prop: Proposal) {
    expect(prop.address).to.be.equal(await newRespect.getAddress());

    const pId = propId({ addr: prop.address, cdata: prop.cdata, memo: prop.memo});

    expect(prop.id).to.be.equal(pId);
    expectAproxNow(prop.createTime);
    expect(prop.yesWeight).to.be.equal(prop.noWeight).to.be.equal(0)
    expect(prop.yesWeight).to.be.equal(prop.noWeight).to.be.equal(0)
    expect(prop.execStatus).to.be.equal(ExecStatus.NotExecuted);
    expect(prop.stage).to.be.equal(Stage.Voting);
    expect(prop.voteStatus).to.be.equal(VoteStatus.Failing); // Because there are no votes yet
  }

  async function expectInitOnChainProp(prop: Proposal) {
    const pId = propId({ addr: prop.address, cdata: prop.cdata, memo: prop.memo});

    const onchainProp = await orec.proposals(pId);

    expect(onchainProp.createTime).to.be.equal(prop.createTime);
    expect(onchainProp.yesWeight).to.be.equal(prop.yesWeight);
    expect(onchainProp.noWeight).to.be.equal(prop.noWeight);
    expect(onchainProp.status).to.be.equal(ExecStatus.NotExecuted);
  }

  function expectAproxNow(date: Date) {
    const now = Date.now() / 1000;
    const diff = now - date.getTime();
    expect(Math.abs(diff) < 1).to.be.true;
  }

  describe("submitting breakout room results", function() {
    before("submit some results", async function() {

      await expect(cl.submitBreakoutResult(groupRes[2])).to.not.be.rejected;
      await expect(cl.submitBreakoutResult(groupRes[1])).to.not.be.rejected;
      await expect(cl.submitBreakoutResult(groupRes[0])).to.not.be.rejected;
      // TODO: submit with more different accounts

      time.increase(HOUR_1);
    })

    describe("lsProposals", function() {
      before("call lsProposals", async function() {
        resultProps = await cl.lsProposals();
      });
      it("should return submitted proposals ordered from newest to oldest", async function() {
        for (const [index, prop] of resultProps.entries()) {
          const rb = expectRespectBreakout(prop);

          expect(rb.meetingNum).to.be.equal(1);
          expect(rb.groupNum).to.be.equal(groupRes[index].groupNum);
          expect(rb.rankings).to.be.deep.equal(groupRes[index].rankings);
        }
      });

      it("should return proposals with proposal ids consistent with the onchain message proposed", async function() {
        for (const [index, prop] of resultProps.entries()) {
          const rb = expectRespectBreakout(prop);

          const msg: Orec.MessageStruct = { 
            addr: prop.address,
            cdata: prop.cdata,
            memo: prop.memo
          };

          const pId = propId(msg);
          expect(prop.id).to.be.equal(pId);
        }
      });
      it("should have new respect contract as the address of proposed message", async function() {
        for (const [index, prop] of resultProps.entries()) {
          expect(prop.address).to.be.equal(await newRespect.getAddress());
        }
      });
    })
    it("should have created proposals onchain", async function () {
      for (const [index, prop] of resultProps.entries()) {
        const rb = expectRespectBreakout(prop);

        const msg: Orec.MessageStruct = { 
          addr: prop.address,
          cdata: prop.cdata,
          memo: prop.memo
        };

        const pId = propId(msg);

        const onChainProp = await orec.proposals(pId);

        expect(onChainProp.createTime).to.be.equal(prop.createTime);
        expectAproxNow(prop.createTime);
        expect(onChainProp.yesWeight).to.be.equal(prop.yesWeight).to.be.equal(0);
        expect(onChainProp.noWeight).to.be.equal(prop.noWeight).to.be.equal(0);
        expect(onChainProp.status).to.be.equal(prop.execStatus).to.be.equal(ExecStatus.NotExecuted);
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
      await expect(cl.proposeRespectTo(mintReqs[0])).to.not.be.reverted;
      await expect(cl.proposeRespectTo(mintReqs[1])).to.not.be.reverted;

      time.increase(HOUR_1);
    });
    before("retrieve new list of proposals through lsProposals", async function() {
      proposals = await cl.lsProposals();
    });

    it("should have returned expected mint proposals", async function() {
      // Take top two proposals
      const props = proposals.slice(proposals.length-2).reverse();
      
      for (const [index, prop] of props.entries()) {
        const req = mintReqs[index];

        expect(prop.address).to.be.equal(await newRespect.getAddress());

        expectInitPropValues(prop);

        const ra = expectRespectAccount(prop);
        expect(ra.meetingNum).to.be.equal(1);
        expect(ra.account).to.be.equal(req.account);
        expect(ra.reason).to.be.equal(req.reason);
        expect(ra.title).to.be.equal(req.title);
        expect(ra.value).to.be.equal(req.value);
      }

    });

    it("should have created new proposals onchain", async function() {
      // Take top two proposals
      const props = proposals.slice(proposals.length-2).reverse();
      
      for (const [index, prop] of props.entries()) {
        expectInitOnChainProp(prop);
      }
    })
  });
  describe("proposing a tick (to increment meeting number)", function() {
    before("create proposal by calling proposeTick", async function() {
      await expect(cl.proposeTick()).to.not.be.reverted;
      await expect(cl.proposeTick("some memo")).to.not.be.reverted;

      time.increase(HOUR_1);
    });
    before("retrieve new list of proposals through lsProposals", async function() {
      proposals = await cl.lsProposals();
    });

    it("should return period number of 0 before the tick is executed", async function() {
      expect(await cl.getPeriodNum()).to.be.equal(0);
      expect(await cl.getNextMeetingNum()).to.be.equal(0);
    });

    it("should have returned expected tick proposals", async function() {
      // Take top two proposals
      const prop1 = proposals[proposals.length - 1];
      const prop2 = proposals[proposals.length - 2];
      
      expectInitPropValues(prop1);
      const t1 = expectTick(prop1);
      expect(t1.data).to.be.equal("some memo");

      expectInitPropValues(prop2);
      const t2 = expectTick(prop2);
      expect(t2.data).to.be.undefined;
    });

    it("should have created new proposal onchain", async function() {
      // Take top two proposals
      const props = proposals.slice(proposals.length-2).reverse();
      
      for (const [index, prop] of props.entries()) {
        expectInitOnChainProp(prop);
        
      }
    })
  });
  describe("proposing a custom signal", function() {
    before("create proposal by calling proposeSignal", async function() {
      await expect(cl.proposeCustomSignal("some memo")).to.not.be.reverted;
      await expect(cl.proposeCustomSignal("some memo 2")).to.not.be.reverted;

      time.increase(HOUR_1);
    });
    before("retrieve new list of proposals through lsProposals", async function() {
      proposals = await cl.lsProposals();
    });

    it("should have returned expected signal proposals", async function() {
      // Take top two proposals
      const prop1 = proposals[proposals.length - 1];
      const prop2 = proposals[proposals.length - 2];
      
      expectInitPropValues(prop1);
      const s1 = expectCustomSignal(prop1);
      expect(s1.data).to.be.equal("some memo 2");

      expectInitPropValues(prop2);
      const s2 = expectTick(prop2);
      expect(s2.data).to.be.equal("some memo");
    });

    it("should have created new proposal onchain", async function() {
      // Take top two proposals
      const props = proposals.slice(proposals.length-2).reverse();
      
      for (const [index, prop] of props.entries()) {
        expectInitOnChainProp(prop);
      }
    })
    
  })
  describe("voting for existing proposal", function() {
    it("should vote YES successfully with respect holder account", )
    it("should vote YES successfully with account which does not have any respect")
    it("should update yesWeight")
    it("should update onchain yesWeight")

    it("should vote NO successfully with respect holder account")
    it("should vote NO successfully with account which does not have any respect")
    it("should update noWeight");
    it("should update onchain noWeight")

    it("should throw if attempting to vote YES after voting time ended")
    it("should vote NO successfully during veto time")

    it("should throw if voting NO or YES after veto time")
  });
  describe("failing a proposal", function() {

  });
  describe("passing a proposal", function() {})
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
  describe("proposing to burn respect of an individual account", function() {})
  describe("burning respect of individual account");
});