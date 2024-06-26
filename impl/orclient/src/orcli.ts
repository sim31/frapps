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
import { packTokenId } from "ortypes/respect1155.js";
import { stringify } from "ts-utils";

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

  private _formatResult(obj: any): string {
    return stringify(obj);
  }

  /**
   * Returns proposal by id
   * @param id - proposal id
   */
  async getProposal(id: PropId): Promise<string> {
    return this._formatResult(await this.orclient.getProposal(id));
  }

  async getOnChainProp(id: PropId): Promise<string> {
    const prop = await this.orclient.context.orec.proposals(id);
    return stringify(prop);
  }

  // UC8
  /**
   * Returns a list of proposals ordered from latest to oldest
   * @param from - Start of proposal range. 0 - last proposal, 1 - second to  last proposal and so on
   * @param count - Number of proposals to return
   */
  async lsProposals(from: number = 0, limit: number = 50): Promise<string> {
    return this._formatResult(await this.orclient.lsProposals(from, limit));
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
  ): Promise<string> {
    return this._formatResult(
      await this.orclient.submitBreakoutResult(request, vote)
    );
  }
  // UC5
  async proposeRespectTo(
    req: RespectAccountRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<string> {
    return this._formatResult(
      await this.orclient.proposeRespectTo(req, vote)
    );
  }

  // UC6
  async burnRespect(
    req: BurnRespectRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<string> {
    return this._formatResult(
      await this.orclient.burnRespect(req, vote)
    );
  }

  async proposeCustomSignal(
    req: CustomSignalRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<string> {
    return this._formatResult(
      await this.orclient.proposeCustomSignal(req, vote)
    );
  }

  // UC7
  async proposeTick(
    req: TickRequest = {},
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<string> {
    return this._formatResult(
      await this.orclient.proposeTick(req, vote)
    );
  }

  async proposeCustomCall(
    req: CustomCallRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<string> {
    return this._formatResult(
      await this.orclient.proposeCustomCall(req, vote)
    );
  }

  async getVote(propId: PropId, voter: EthAddress): Promise<string> {
    return this._formatResult(
      await this.orclient.getVote(propId, voter)
    );
  }

  async oldRespectOf(account: EthAddress): Promise<bigint> {
    return await this.orclient.oldRespectOf(account);
  }

  async respectOf(account: EthAddress): Promise<bigint> {
    return await this.orclient.respectOf(account);
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


(ORCli.prototype['submitBreakoutResult'] as any)['help'] = 
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

(ORCli.prototype['proposeRespectTo'] as any)['help'] = 
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

(ORCli.prototype['burnRespect'] as any)['help'] = 
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

(ORCli.prototype['proposeTick'] as any)['help'] =
`
async proposeTick(
  req: TickRequest = {},
  vote: VoteWithPropRequest = { vote: VoteType.Yes }
): Promise<PutProposalRes> {

=== req ===
${tickReqDoc.text}

=== vote ===
${voteWithPropReqDoc.text}

=== Example ===
await cli.proposeTick()
`;

(ORCli.prototype['vote'] as any)['help'] =
`
async vote(request: VoteRequest): Promise<void>;

=== request ===
${voteRequestDoc.text}

=== Example ===
await cli.vote(${voteRequestDoc.exampleText})
`;

// TODO: Make lsProposals accept range... Probably in terms of dates...
(ORCli.prototype['lsProposals'] as any)['help'] =
`
async lsProposals(): Promise<Proposal[]> {

=== Example ===
await cli.lsProposals()
`;

(ORCli.prototype['getProposal'] as any)['help'] =
`
async getProposal(id: PropId): Promise<Proposal> {

=== id ===
${propIdDoc.schemaText}

=== Example ===
await cli.getProposal(${propIdDoc.exampleText})
`;
