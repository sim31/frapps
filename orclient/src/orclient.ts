import { Signer } from "ethers";
import { EthAddress, PropId, ProposalState } from "./common.js";
import { Config, Proposal } from "./orclientTypes.js";

export function isPropCreated(propState: ProposalState) {
  return propState.createTime > 0n;
}

export default class ORClient {
  private _config: Config;
  private _newRespectAddr?: EthAddress;

  private constructor(config: Config) {
    this._config = config;
  }

  static async createORClient(config: Config): Promise<ORClient> {
    const client = new ORClient(config);
    client._config = config;
    client._newRespectAddr = await config.newRespect.getAddress();

    return client;
  }

  connect(signer: Signer): ORClient {
    const newCl = Object.create(this);
    newCl._config.signer = signer;
    return newCl;
  }

  private async _getProposalFromChain(id: PropId): Promise<Proposal> {
    const propState = zProposalState.parse(await this._config.orec.proposals(id));
    const stage = zStage.parse(await this._config.orec.getStage(id));
    const voteStatus = zVoteStatus.parse(await this._config.orec.getVoteStatus(id));

    const r: Proposal = {
      id: id,
      createTime: new Date(Number(propState.createTime) * 1000),
      yesWeight: propState.yesWeight,
      noWeight: propState.noWeight,
      status: zExecStatus.parse(propState.status),
      stage,
      voteStatus,
    }

    return r;
  }

  /**
   * Returns proposal by id
   * @param id - proposal id
   */
  async getProposal(id: PropId): Promise<Proposal> {
    // TODO: use async transforms instead
    const prop = await this._getProposalFromChain(id);
    const nodeProp = await this._config.ornode.getProposal(id);

    if (nodeProp.content !== undefined) {
      prop.address = nodeProp.content.address;
      prop.cdata = nodeProp.content.cdata;

      if (nodeProp.attachment !== undefined) {
        let decoded: DecodedProposal;
        switch (nodeProp.attachment.propType) {
          case 'respectBreakout': {
            const parsedNprop = this._config.ornode.getProposalTypes().respectBreakout.parse(nodeProp);
            // TODO: add context
            decoded = zProposalToRespectBreakout.parse(parsedNprop);
            prop.decoded = decoded;
            break;
          }
          case 'respectAccount': {
            break;
          }
          case 'burnRespect': {
            break;
          }
          case 'customSignal': {
            break;
          }
          case 'tick': {
            break;
          }
          case 'customCall': {
            break;
          }
          default: {
            const exhaustiveCheck: never = prop.attachment;
          }
        }

      }
    }

    if (nodeProp.attachment !== undefined && nodeProp.content !== undefined) {


    }
  }

  // UC8
  /**
   * Returns a list of proposals ordered from latest to oldest
   * @param from - Start of proposal range. 0 - last proposal, 1 - second to  last proposal and so on
   * @param count - Number of proposals to return
   */
  async lsProposals(from: number = 0, limit: number = 50): Promise<Proposal[]> {
    return []
  }

  // UC2
  async vote(propId: PropId, vote: VoteType, memo?: string) {}
  // UC3
  async execute(propId: PropId) {}

  // UC{1,4}
  async submitBreakoutResult(result: BreakoutResult, metadata?: ProposalMetadata): Promise<Proposal> {
    // Send proposal
    throw new NotImplemented("submitBreakoutResult");
  }
  // UC5
  async proposeRespectTo(req: RespectAccountRequest, metadata?: ProposalMetadata): Promise<Proposal> {
    throw new NotImplemented("proposeRespectTo");
  }
  // UC6
  async burnRespect(
    tokenId: TokenId,
    reason: string,
    metadata?: ProposalMetadata
  ): Promise<Proposal> {
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