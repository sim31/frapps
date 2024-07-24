import { zodToJsonSchema } from "zod-to-json-schema";
import { Signer, hexlify, toUtf8Bytes, toBeHex, zeroPadBytes } from "ethers";
import { BurnRespectRequest, CustomCallRequest, CustomSignalRequest, Proposal, RespectAccountRequest, RespectBreakoutRequest, TickRequest, VoteRequest, VoteWithPropRequest, zBurnRespectRequest, zRespectAccountRequest, zRespectBreakoutRequest, zTickRequest, zVoteRequest, zVoteWithPropRequest } from "ortypes/orclient.js";
// import { zProposal as zNProposal, zORNodePropStatus } from "./ornode.js";
import { ZodType, z } from "zod";
import { ORClient, PutProposalRes } from "./orclient.js";
import { ORContext } from "ortypes/orContext.js";
import { ConfigWithOrnode } from "ortypes/orContext.js";
import { Bytes, EthAddress, PropId, Vote, zPropId } from "ortypes";
import { VoteType } from "ortypes/orclient.js";
import { packTokenId, RespectAwardMt, RespectFungibleMt, TokenId } from "ortypes/respect1155.js";
import { stringify } from "ts-utils";
import { Erc1155Mt } from "ortypes/erc1155.js";

function createSchemaDescription<ZT extends ZodType>(
  zType: ZT,
  exampleObj?: z.infer<ZT>,
) {

  const jsonSchema = zodToJsonSchema(zType);
  const schemaText = stringify(jsonSchema);

  if (exampleObj !== undefined) {
    zType.parse(exampleObj);

    const exampleText = stringify(exampleObj);

    const text =`\nSchema:\n${schemaText}\n\nExample:\n ${exampleText}`
    return {
      schema: jsonSchema,
      schemaText,
      exampleText, 
      text,
    }
  } else {

    const text =`\nSchema:\n${schemaText}\n`;
    return {
      schema: jsonSchema,
      schemaText,
      text
    } 
  }
}

const propIdDoc = createSchemaDescription(
  zPropId,
  zeroPadBytes("0x1133", 32)
);

const respectBreakoutReqDoc = createSchemaDescription(
  zRespectBreakoutRequest,
  {
    meetingNum: 1,
    groupNum: 1,
    rankings: [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    ]
  }
)

const voteWithPropReqDoc = createSchemaDescription(
  zVoteWithPropRequest,
  {
    memo: "Some memo",
    vote: "Yes"
  }
);

const respectAccounReqDoc = createSchemaDescription(
  zRespectAccountRequest,
  {
    meetingNum: 1,
    mintType: 1,
    account: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    value: 10n,
    title: "Reward Title",
    reason: "Reward reason"
  }
);

const burnRespectReqDoc = createSchemaDescription(
  zBurnRespectRequest,
  {
    tokenId: toBeHex(packTokenId({
      owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      periodNumber: 2,
      mintType: 1
    }), 32),
    reason: "some optional reason"
  }
);

const tickReqDoc = createSchemaDescription(
  zTickRequest,
  {
    link: "http://someoptionallink.com/page"
  }
);

const voteRequestDoc = createSchemaDescription(
  zVoteRequest,
  {
    propId: zeroPadBytes("0x05", 32),
    vote: "Yes",
    memo: "Optional memo"
  }
)

export class ORCli {
  orclient: ORClient;

  constructor(orclient: ORClient) {
    this.orclient = orclient;
  }

  connect(signer: Signer): void {
    this.orclient = this.orclient.connect(signer);
  }

  get context(): ORContext<ConfigWithOrnode> {
    return this.orclient.context;
  }

  private async _printResult(obj: Promise<any>): Promise<void> {
    try {
      console.log(stringify(await obj));
    } catch (err) {
      console.error(`Error: ${stringify(err)}`);
    }
  }

  /**
   * Returns proposal by id
   * @param id - proposal id
   */
  async getProposal(id: PropId): Promise<void> {
    this._printResult(this.orclient.getProposal(id));
  }

  async getOnChainProp(id: PropId): Promise<void> {
    const prop = this.orclient.context.orec.proposals(id);
    await this._printResult(prop);
  }

  // UC8
  /**
   * Returns a list of proposals ordered from latest to oldest
   * @param from - Start of proposal range. 0 - last proposal, 1 - second to  last proposal and so on
   * @param count - Number of proposals to return
   */
  async lsProposals(from: number = 0, limit: number = 50): Promise<void> {
    await this._printResult(this.orclient.lsProposals(from, limit));
  }

  // UC2
  // TODO: Allow specifying text string instead of hexstring and convert it
  async vote(propId: PropId, vote: VoteType, memo?: string): Promise<string>;
  async vote(request: VoteRequest): Promise<string>;
  async vote(pidOrReq: VoteRequest | PropId, vote?: VoteType, memo?: string): Promise<string> {
    if (typeof pidOrReq === 'string') {
      await this.orclient.vote(pidOrReq, vote!, memo);
    } else {
      await this.orclient.vote(pidOrReq);
    }
    return 'success';
  }

  encodeMemo(memo?: string): Bytes {
    return this.orclient.encodeMemo(memo);
  }

  // UC3
  async execute(propId: PropId) {
    await this.orclient.execute(propId);
  }

  // UC{1,4}
  async submitBreakoutResult(
    request: RespectBreakoutRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<void> {
    await this._printResult(
      this.orclient.submitBreakoutResult(request, vote)
    );
  }
  // UC5
  async proposeRespectTo(
    req: RespectAccountRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<void> {
    if (typeof req.value === 'string') {
      req.value = BigInt(req.value);
    }
    await this._printResult(
      this.orclient.proposeRespectTo(req, vote)
    );
  }

  // UC6
  async burnRespect(
    req: BurnRespectRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<void> {
    await this._printResult(
      this.orclient.burnRespect(req, vote)
    );
  }

  async proposeCustomSignal(
    req: CustomSignalRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<void> {
    return await this._printResult(
      this.orclient.proposeCustomSignal(req, vote)
    );
  }

  // UC7
  async proposeTick(
    req: TickRequest = {},
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<void> {
    await this._printResult(
      this.orclient.proposeTick(req, vote)
    );
  }

  async proposeCustomCall(
    req: CustomCallRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<void> {
    await this._printResult(
      this.orclient.proposeCustomCall(req, vote)
    );
  }

  async getVote(propId: PropId, voter: EthAddress): Promise<void> {
    await this._printResult(
      this.orclient.getVote(propId, voter)
    );
  }

  async oldRespectOf(account: EthAddress): Promise<bigint> {
    return await this.orclient.oldRespectOf(account);
  }

  async respectOf(account: EthAddress): Promise<bigint> {
    return await this.orclient.respectOf(account);
  }

  async getToken(tokenId: TokenId, opts?: any): Promise<Erc1155Mt> {
    return this.orclient.getToken(tokenId, opts);
  }

  async getAward(tokenId: TokenId, opts?: any): Promise<RespectAwardMt> {
    return this.orclient.getAward(tokenId, opts);
  }

  async getRespectMetadata(): Promise<RespectFungibleMt> {
    return this.orclient.getRespectMetadata();
  }

  async getAwardsOf(account: EthAddress, opts?: any): Promise<RespectAwardMt[]> {
    return this.orclient.getAwardsOf(account, opts);
  }

  async getPeriodNum(): Promise<number> {
    return this.orclient.getPeriodNum();
  }
  async getNextMeetingNum(): Promise<number> {
    return this.orclient.getNextMeetingNum();
  }
  async getLastMeetingNum(): Promise<number> {
    return await this.orclient.getLastMeetingNum();
  }
}

function strToLog(str: string) {
  return () => console.log(str);
}

const submitStr = 
`
async submitBreakoutResult(
  request: RespectBreakoutRequest,
  vote: VoteWithPropRequest = { vote: VoteType.Yes }
)

=== request ===
${respectBreakoutReqDoc.text}

=== vote ===
${voteWithPropReqDoc.text}

=== Example ===
await cli.submitBreakoutResult(
  ${respectBreakoutReqDoc.exampleText},
  ${voteWithPropReqDoc.exampleText}
)
`;
(ORCli.prototype['submitBreakoutResult'] as any)['help'] = strToLog(submitStr);

const proposeRespectToStr = 
`
async proposeRespectTo(
  req: RespectAccountRequest,
  vote: VoteWithPropRequest = { vote: VoteType.Yes }
)

=== request ===
${respectAccounReqDoc.text}

=== vote ===
${voteWithPropReqDoc.text}

=== Example ===
await cli.proposeRespectTo(
  ${respectAccounReqDoc.exampleText},
  ${voteWithPropReqDoc.exampleText}
)
`;
(ORCli.prototype['proposeRespectTo'] as any)['help'] = strToLog(proposeRespectToStr);

const burnRespectStr = 
`
async burnRespect(
  req: BurnRespectRequest,
  vote: VoteWithPropRequest = { vote: VoteType.Yes }
): Promise<PutProposalRes> {

=== req ===
${burnRespectReqDoc.text}

=== vote ===
${burnRespectReqDoc.text}

=== Example ===
await cli.burnRespect(
  ${burnRespectReqDoc.exampleText},
  ${voteWithPropReqDoc.exampleText}
)
`;

(ORCli.prototype['burnRespect'] as any)['help'] = strToLog(burnRespectStr);

const proposeTickStr =
`
async proposeTick(
  req: TickRequest = {},
  vote: VoteWithPropRequest = { vote: VoteType.Yes }
): Promise<PutProposalRes> {

Proposal to increment period number, which is used to determine meeting number automatically.

=== req ===
${tickReqDoc.text}

=== vote ===
${voteWithPropReqDoc.text}

=== Example ===
await cli.proposeTick()
`;

(ORCli.prototype['proposeTick'] as any)['help'] = strToLog(proposeTickStr);

const voteStr =
`
async vote(request: VoteRequest): Promise<void>;

=== request ===
${voteRequestDoc.text}

=== Example ===
await cli.vote(${voteRequestDoc.exampleText})
`;
(ORCli.prototype['vote'] as any)['help'] = strToLog(voteStr);

// TODO: Make lsProposals accept range... Probably in terms of dates...
const lsProposalsStr =
`
async lsProposals(): Promise<Proposal[]> {

=== Example ===
await cli.lsProposals()
`;
(ORCli.prototype['lsProposals'] as any)['help'] = strToLog(lsProposalsStr);

const getProposalStr =
`
async getProposal(id: PropId): Promise<Proposal> {

=== id ===
${propIdDoc.schemaText}

=== Example ===
await cli.getProposal(${propIdDoc.exampleText})
`;
(ORCli.prototype['getProposal'] as any)['help'] = strToLog(getProposalStr);

const executeStr =
`
async execute(propId: PropId)

Executes a proposal identified by propId.

=== Example ===
await cli.execute()
`
