import { Signer, hexlify, toUtf8Bytes, ContractTransactionResponse, ContractTransactionReceipt, toBeHex } from "ethers";
import { BurnRespectRequest, CustomCallRequest, CustomSignalRequest, Proposal, RespectAccountRequest, RespectBreakoutRequest, TickRequest, VoteRequest, VoteWithProp, VoteWithPropRequest, zVoteWithProp } from "ortypes/orclient.js";
import { TxFailed } from "./errors.js";
import { ORContext, ConfigWithOrnode } from "ortypes/orContext.js";
import { NodeToClientTransformer } from "ortypes/transformers/nodeToClientTransformer.js";
import { ClientToNodeTransformer } from "ortypes/transformers/clientToNodeTransformer.js";
import { ProposalFull as NProp, ORNodePropStatus } from "ortypes/ornode.js";
import { ErrorDecoder } from 'ethers-decode-error'
import type { DecodedError } from 'ethers-decode-error'
import { Bytes, PropId, ProposalNotCreated, ProposalState, VoteType } from "ortypes";
import { Method, Path, Input, Response } from "./ornodeClient/ornodeClient.js";
import { sleep } from "ts-utils";

export function isPropCreated(propState: ProposalState) {
  return propState.createTime > 0n;
}

export interface Config {
  /// How many onchain confirmations to wait for before considering proposal submitted
  propConfirms: number,
  /// How many onchain confirmations to wait for, for all other transactions
  otherConfirms: number,
  propSubmitRetries: number,
  propResubmitInterval: number
}

export const defaultConfig: Config = {
  propConfirms: 3,
  otherConfirms: 3,
  propSubmitRetries: 4,
  propResubmitInterval: 3000
}

export interface PutProposalRes {
  proposal: Proposal,
  status: ORNodePropStatus
}

/**
 * @notice When creating proposals this class first creates them onchain then tries to push them to ORNode (because ORNode won't accept them until they are submitted onchain).
 * This creates a risk that proposal is submitted onchain but fails to be submitted to ORNode.
 * For now the way we deal with it is that simply throw an exception with a ornode proposal we were trying to push.
 * The user of this class can then try doing {orclient}.context.ornode.putProposal(prop) again.
 * Worst case scenario is that some metadata about a proposal won't be visible in the frontend
 * because the creator of proposal failed to submit to ornode. That's not the worst thing that could happen - other users simply shouldn't vote for proposal if they lack details about it.
 * 
 */
export class ORClient {
  private _ctx: ORContext<ConfigWithOrnode>;
  private _nodeToClient: NodeToClientTransformer;
  private _clientToNode: ClientToNodeTransformer;
  private _cfg: Config;
  private _errDecoder: ErrorDecoder;

  constructor(context: ORContext<ConfigWithOrnode>, cfg: Config = defaultConfig) {
    this._ctx = context;
    this._nodeToClient = new NodeToClientTransformer(this._ctx);
    this._clientToNode = new ClientToNodeTransformer(this._ctx);
    this._cfg = cfg;
    this._errDecoder = ErrorDecoder.create([
      // TODO: this function accepts interfaces, so you should not need to copy fragments
      // But for some reason it does not work (throws r.filter is not a function). I think it is this line:
      // https://github.com/superical/ethers-decode-error/blob/5ba3ce49bcb5cd2824fc25014a00cd1e4f96ede1/src/error-decoder.ts#L116
      // `instanceof` check fails because interface is being created by a different constructor function than ErrorDecoder uses.
      // There's a problem with ethers / typechain commonjs vs ESM versions.
      // Maybe I have a commonjs version of interface created by hardhat
      // and ErrorDecoder is expecting esm?
      new Array(...this._ctx.orec.interface.fragments),
      new Array(...this._ctx.newRespect.interface.fragments),
    ]);
  }

  connect(signer: Signer): ORClient {
    const newCtx = this._ctx.connect(signer);    
    return new ORClient(newCtx);
  }

  get context(): ORContext<ConfigWithOrnode> {
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
    //client.provide("get", "/v1/user/retrieve", { id: "10" });
    // const response = await ornodeClient.provide("post", "/v1/getProposal", { propId: id });
    const proposal = await this._ctx.ornode.getProposal(id);
    return this._nodeToClient.transformProp(proposal);
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
  // TODO: Allow specifying text string instead of hexstring and convert it
  async vote(propId: PropId, vote: VoteType, memo?: string): Promise<void>;
  async vote(request: VoteRequest): Promise<void>;
  async vote(pidOrReq: VoteRequest | PropId, vote?: VoteType, memo?: string): Promise<void> {
    let req: VoteRequest;
    if (vote !== undefined && typeof pidOrReq === 'string') {
      req = { propId: pidOrReq, vote, memo }      
    } else {
      req = pidOrReq as VoteRequest;
    }
    const m = this.encodeMemo(req.memo);
    const orec = this._ctx.orec;
    const errMsg = `orec.vote(${req.propId}, ${req.vote}, ${m})`
    const promise = orec.vote(req.propId, req.vote, m);
    await this._handleTxPromise(promise, this._cfg.otherConfirms, errMsg);
  }

  encodeMemo(memo?: string): Bytes {
    return memo !== undefined && memo != "" ? hexlify(toUtf8Bytes(memo)) : "0x";
  }

  // UC3
  async execute(propId: PropId) {
    const orec = this._ctx.orec;
    const nprop = await this._ctx.ornode.getProposal(propId);
    if (nprop.content !== undefined) {
      const errMsg = `orec.execute(${propId})`;
      const promise = orec.execute(nprop.content);
      await this._handleTxPromise(promise, this._cfg.otherConfirms, errMsg);
    }
  }

  // UC{1,4}
  async submitBreakoutResult(
    request: RespectBreakoutRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    console.debug("submitting breakout result");
    const v = zVoteWithProp.parse(vote); 
    console.debug("parsed vote");
    const proposal = await this._clientToNode.transformRespectBreakout(request);
    return await this._submitProposal(proposal, v);
  }
  // UC5
  async proposeRespectTo(
    req: RespectAccountRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 
    const proposal = await this._clientToNode.transformRespectAccount(req);
    return await this._submitProposal(proposal, v);
  }

  // UC6
  async burnRespect(
    req: BurnRespectRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 
    const proposal = await this._clientToNode.transformBurnRespect(req);
    return await this._submitProposal(proposal, v);
  }

  async proposeCustomSignal(
    req: CustomSignalRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 
    const proposal = await this._clientToNode.transformCustomSignal(req);
    return await this._submitProposal(proposal, v);
  }

  // UC7
  async proposeTick(
    req: TickRequest = {},
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 

    if (req.data === undefined) {
      req.data = toBeHex(await this.getNextMeetingNum());
    }

    const proposal = await this._clientToNode.transformTick(req);
    return await this._submitProposal(proposal, v);
  }

  async proposeCustomCall(
    req: CustomCallRequest,
    vote: VoteWithPropRequest = { vote: VoteType.Yes }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 
    const proposal = await this._clientToNode.transformCustomCall(req);
    return await this._submitProposal(proposal, v);
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

  private async _submitProposal(proposal: NProp, vote?: VoteWithProp): Promise<PutProposalRes> {
    console.debug("submitting to chain: ", proposal);
    await this._submitPropToChain(proposal, vote);
    console.debug("submitting to ornode");
    const status = await this._submitPropToOrnode(proposal);
    console.debug("Submitted proposal id: ", proposal.id, "status: ", status);
    const cprop = await this._nodeToClient.transformProp(proposal);
    return {
      proposal: cprop,
      status
    };
  }

  private async _submitPropToOrnode(proposal: NProp): Promise<ORNodePropStatus> {
    let attempts = 0;
    let _err: any;
    while (attempts < this._cfg.propSubmitRetries) {
      try {
        if (attempts > 0) {
          await sleep(this._cfg.propResubmitInterval);
        }
        const status = await this._ctx.ornode.putProposal(proposal);
        return status;
      } catch (error) {
        _err = error;
        if (error instanceof ProposalNotCreated) {
          attempts += 1;
          console.log("Submitting proposal to ornode failed with error ProposalNotCreated. Attempt count: ", attempts, ". Proposal: ", JSON.stringify(proposal));
        } else {
          throw error;
        }
      }
    }
    console.error("Attempt limit for submitting proposal exceeded.");
    throw _err;
  }

  private async _submitPropToChain(proposal: NProp, vote?: VoteWithProp) {
    const errMsg = `Submitting proposal: ${JSON.stringify(proposal)}`;
    const resp = this._submitPropTx(proposal, vote);
    await this._handleTxPromise(resp, this._cfg.propConfirms, errMsg);
  }
  private async _submitPropTx(proposal: NProp, vote?: VoteWithProp) {
    if (vote !== undefined && vote.vote !== VoteType.None) {
      return this._ctx.orec.vote(
          proposal.id,
          vote.vote,
          this.encodeMemo(vote.memo)
      );
    } else {
      return this._ctx.orec.propose(proposal.id);
    }
  }

  private async _handleTxPromise(
    promise: Promise<ContractTransactionResponse>,
    confirms: number,
    errMsg?: string
  ) {
    let resp: Awaited<typeof promise>;
    let receipt: Awaited<ReturnType<typeof resp.wait>>;
    try {
      resp = await promise;
      receipt = await resp.wait(confirms);
    } catch(err) {
      let decoded: DecodedError;
      try {
        decoded = await this._errDecoder.decode(err);
      } catch(err2) {
        throw new TxFailed(err2, undefined, `Error decoding error. errMsg: ${errMsg}`);
      }
      throw new TxFailed(err, decoded, errMsg);
    }
    if (receipt?.status !== 1) {
      throw new TxFailed(resp, receipt, errMsg);
    }
  }

  // TODO: function to list respect NTTs
}