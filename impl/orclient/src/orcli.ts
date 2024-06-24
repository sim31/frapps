import { zodToJsonSchema } from "zod-to-json-schema";
import { Signer, hexlify, toUtf8Bytes, toBeHex, zeroPadBytes } from "ethers";
import { BurnRespectRequest, CustomCallRequest, CustomSignalRequest, Proposal, RespectAccountRequest, RespectBreakoutRequest, TickRequest, VoteRequest, VoteWithPropRequest, zBurnRespectRequest, zRespectAccountRequest, zRespectBreakoutRequest, zTickRequest, zVoteWithPropRequest } from "ortypes/orclient.js";
// import { zProposal as zNProposal, zORNodePropStatus } from "./ornode.js";
import { ZodType, z } from "zod";
import { ORClient, PutProposalRes } from "./orclient.js";
import { ORContext } from "ortypes/orContext.js";
import { ConfigWithOrnode } from "ortypes/orContext.js";
import { Bytes, PropId, VoteType } from "ortypes";
import { packTokenId } from "ortypes/respect1155.js";

function createSchemaDescription<ZT extends ZodType>(
  zType: ZT,
  exampleObj?: z.infer<ZT>,
) {
  const stringify = (obj: any) => JSON.stringify(
    obj,
    (_, v) => typeof v === 'bigint' ? v.toString() : v, 
    2
  );

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
    vote: VoteType.Yes
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
    reason: "some reason"
  }
);

const tiReqDoc = createSchemaDescription(
  zTickRequest,
  {
    link: "http://someaddress.com/page"
  }
);

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

  /**
   * Returns proposal by id
   * @param id - proposal id
   */
  async getProposal(id: PropId): Promise<Proposal> {
    return this.orclient.getProposal(id);
  }

  // UC8
  /**
   * Returns a list of proposals ordered from latest to oldest
   * @param from - Start of proposal range. 0 - last proposal, 1 - second to  last proposal and so on
   * @param count - Number of proposals to return
   */
  async lsProposals(from: number = 0, limit: number = 50): Promise<Proposal[]> {
    return this.orclient.lsProposals(from, limit);
  }

  // UC2
  // TODO: Allow specifying text string instead of hexstring and convert it
  async vote(propId: PropId, vote: VoteType, memo?: string): Promise<void>;
  async vote(request: VoteRequest): Promise<void>;
  async vote(pidOrReq: VoteRequest | PropId, vote?: VoteType, memo?: string): Promise<void> {
    if (typeof pidOrReq === 'string') {
      return this.orclient.vote(pidOrReq, vote!, memo);
    } else {
      return this.orclient.vote(pidOrReq);
    }
  }

  encodeMemo(memo?: string): Bytes {
    return this.orclient.encodeMemo(memo);
  }

  // UC3
  async execute(propId: PropId) {
    this.orclient.execute(propId);
  }

  // UC{1,4}
  async submitBreakoutResult(
    request: RespectBreakoutRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    return this.orclient.submitBreakoutResult(request, vote);
  }
  // UC5
  async proposeRespectTo(
    req: RespectAccountRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    return this.orclient.proposeRespectTo(req, vote);
  }

  // UC6
  async burnRespect(
    req: BurnRespectRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    return this.orclient.burnRespect(req, vote);
  }

  async proposeCustomSignal(
    req: CustomSignalRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    return this.orclient.proposeCustomSignal(req, vote);
  }

  // UC7
  async proposeTick(
    req: TickRequest = {},
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    return this.orclient.proposeTick(req, vote);
  }

  async proposeCustomCall(
    req: CustomCallRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    return this.orclient.proposeCustomCall(req, vote);
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
${tiReqDoc.text}

=== vote ===
${voteWithPropReqDoc.text}

=== Example ===
await cli.proposeTick()
`;
