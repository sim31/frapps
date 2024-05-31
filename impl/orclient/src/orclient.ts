import { Signer } from "ethers";
import { EthAddress, PropId, ProposalState, TokenId, VoteType } from "./common.js";
import { BreakoutResult, BurnRespectRequest, CustomCallRequest, CustomSignalRequest, NotImplemented, Proposal, ProposalMetadata, RespectAccountRequest, RespectBreakoutRequest, TickRequest, TxFailed, VoteRequest, VoteWithProp, zVoteWithProp } from "./orclientTypes.js";
import { ORContext } from "./orContext.js";
import { NodeToClientTransformer } from "./transformers/nodeToClientTransformer.js";
import { ClientToNodeTransformer } from "./transformers/clientToNodeTransformer.js";
import { Proposal as NProp } from "./ornodeTypes.js";

export function isPropCreated(propState: ProposalState) {
  return propState.createTime > 0n;
}

export default class ORClient {
  private _ctx: ORContext;
  private _nodeToClient: NodeToClientTransformer;
  private _clientToNode: ClientToNodeTransformer;

  constructor(context: ORContext) {
    this._ctx = context;
    this._nodeToClient = new NodeToClientTransformer(this._ctx);
    this._clientToNode = new ClientToNodeTransformer(this._ctx);
  }

  get context(): ORContext {
    return this._ctx;
  }

  // static async createORClient(config: Config): Promise<ORClient> {
  //   const client = new ORClient(config);
  //   return client;
  // }

  /**
   * Returns proposal by id
   * @param id - proposal id
   */
  async getProposal(id: PropId): Promise<Proposal> {
    const nprop = await this._ctx.ornode.getProposal(id);
    return this._nodeToClient.transformProp(nprop);
  }

  // UC8
  /**
   * Returns a list of proposals ordered from latest to oldest
   * @param from - Start of proposal range. 0 - last proposal, 1 - second to  last proposal and so on
   * @param count - Number of proposals to return
   */
  async lsProposals(from: number = 0, limit: number = 50): Promise<Proposal[]> {
    const nprops = await this._ctx.ornode.getProposals(from, limit);
    const props: Proposal[] = [];
    for (const nprop of nprops) {
      props.push(await this._nodeToClient.transformProp(nprop));
    }
    return props;
  }

  // UC2
  async vote(req: VoteRequest) {
    const orec = this._ctx.orec;
    await orec.vote(req.propId, req.vote, req.memo ?? "");
  }
  // UC3
  async execute(propId: PropId) {
    const orec = this._ctx.orec;
    const nprop = await this._ctx.ornode.getProposal(propId);
    if (nprop.content !== undefined) {
      await orec.execute(nprop.content);
    }
  }

  // UC{1,4}
  async submitBreakoutResult(
    request: RespectBreakoutRequest,
    vote: VoteWithProp = { vote: VoteType.Yes }
  ): Promise<Proposal> {
    const proposal = await this._clientToNode.transformRespectBreakout(request);
    return await this._submitProposal(proposal, vote);
  }
  // UC5
  async proposeRespectTo(
    req: RespectAccountRequest,
    vote: VoteWithProp = { vote: VoteType.Yes }
  ): Promise<Proposal> {
    const proposal = await this._clientToNode.tranformRespectAccount(req);
    return await this._submitProposal(proposal, vote);
  }

  // UC6
  async burnRespect(
    req: BurnRespectRequest,
    vote: VoteWithProp = { vote: VoteType.Yes }
  ): Promise<Proposal> {
    const proposal = await this._clientToNode.transformBurnRespect(req);
    return await this._submitProposal(proposal, vote);
  }

  async proposeCustomSignal(
    req: CustomSignalRequest,
    vote: VoteWithProp = { vote: VoteType.Yes }
  ): Promise<Proposal> {
    const proposal = await this._clientToNode.transformCustomSignal(req);
    return await this._submitProposal(proposal, vote);
  }

  // UC7
  async proposeTick(
    req: TickRequest,
    vote: VoteWithProp = { vote: VoteType.Yes }
  ): Promise<Proposal> {
    const proposal = await this._clientToNode.transformTick(req);
    return await this._submitProposal(proposal, vote);
  }

  async proposeCustomCall(
    req: CustomCallRequest,
    vote: VoteWithProp = { vote: VoteType.Yes }
  ): Promise<Proposal> {
    const proposal = await this._clientToNode.transformCustomCall(req);
    return await this._submitProposal(proposal, vote);
  }

  async getPeriodNum(): Promise<number> {
    return await this._ctx.ornode.getPeriodNum();
  }
  async getNextMeetingNum(): Promise<number> {
    return await this.getPeriodNum() + 1;
  }
  async getLastMeetingNum(): Promise<number> {
    return await this.getPeriodNum();
  }

  private async _submitProposal(proposal: NProp, vote?: VoteWithProp): Promise<Proposal> {
    await this._submitPropToOrnode(proposal);
    await this._submitPropToChain(proposal, vote);
    return await this._nodeToClient.transformProp(proposal);
  }

  private async _submitPropToOrnode(proposal: NProp) {
    await this._ctx.ornode.putProposal(proposal);
  }

  private async _submitPropToChain(proposal: NProp, vote?: VoteWithProp) {
    const resp = vote !== undefined && vote.vote !== VoteType.None
      ? await this._ctx.orec.vote(
          proposal.id,
          vote.vote,
          vote.memo ?? ""
        )
      : await this._ctx.orec.propose(proposal.id);

    const receipt = await resp.wait();
    if (receipt?.status !== 1) {
      throw new TxFailed(resp, receipt);
    }
  }

  // TODO: function to list respect NTTs
}