import { Signer } from "ethers";
import { EthAddress, PropId, ProposalState, TokenId, VoteType } from "./common.js";
import { BreakoutResult, BurnRespectRequest, NotImplemented, Proposal, ProposalMetadata, RespectAccountRequest, RespectBreakoutRequest, TxFailed } from "./orclientTypes.js";
import { ORContext } from "./orContext.js";
import { NodeToClientTransformer } from "./transformers/nodeToClientTransformer.js";
import { ClientToNodeTransformer } from "./transformers/clientToNodeTransformer.js";

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
  async vote(propId: PropId, vote: VoteType, memo?: string) {
    const orec = this._ctx.orec;
    await orec.vote(propId, vote, memo ? memo : "");
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
  async submitBreakoutResult(request: RespectBreakoutRequest): Promise<Proposal> {
    const proposal = await this._clientToNode.transformRespectBreakout(request);
    await this._ctx.ornode.putProposal(proposal);

    const resp = await this._ctx.orec.vote(
      proposal.id,
      VoteType.Yes,
      request.voteMemo ?? ""
    );
    const receipt = await resp.wait();
    if (receipt?.status === 1) {
      return await this._nodeToClient.transformProp(proposal)
    } else {
      throw new TxFailed(resp, receipt);
    }
  }
  // UC5
  async proposeRespectTo(
    req: RespectAccountRequest,
    vote: boolean = true
  ): Promise<Proposal> {
    const proposal = await this._clientToNode.tranformRespectAccount(req);
    await this._ctx.ornode.putProposal(proposal);

    const resp = vote === true
      ? await this._ctx.orec.vote(
          proposal.id,
          VoteType.Yes,
          req.voteMemo ?? ""
        )
      : await this._ctx.orec.propose(proposal.id);

    const receipt = await resp.wait();
    if (receipt?.status === 1) {
      return await this._nodeToClient.transformProp(proposal)
    } else {
      throw new TxFailed(resp, receipt);
    }
  }
  // UC6
  async burnRespect(req: BurnRespectRequest): Promise<Proposal> {
    throw new NotImplemented("burnRespect");
  }
  // UC7
  async proposeTick(data?: string, metadata?: ProposalMetadata): Promise<Proposal> {
    throw new NotImplemented("proposeTick");
  }
  async proposeCustomSignal(data: string, metadata?: ProposalMetadata): Promise<Proposal> {
    throw new NotImplemented("proposeCustomSignal");
  }

  async getPeriodNum(): Promise<number> {
    return 0;
  }
  async getNextMeetingNum(): Promise<number> {
    return 0;
  }
  async getLastMeetingNum(): Promise<number> {
    return 0;
  }

  // TODO: function to list respect NTTs
}