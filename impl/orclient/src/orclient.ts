import { Signer, hexlify, toUtf8Bytes, ContractTransactionResponse, ContractTransactionReceipt, toBeHex } from "ethers";
import { BurnRespectRequest, CustomCallRequest, CustomSignalRequest, Proposal, RespectAccountRequest, RespectBreakoutRequest, TickRequest, VoteRequest, VoteWithProp, VoteWithPropRequest, zVoteWithProp, VoteType, Vote, GetTokenOpts, GetProposalsSpec } from "ortypes/orclient.js";
import { TxFailed } from "./errors.js";
import { ORContext, ConfigWithOrnode } from "ortypes/orContext.js";
import { NodeToClientTransformer, zNVoteToClient } from "ortypes/transformers/nodeToClientTransformer.js";
import { ClientToNodeTransformer } from "ortypes/transformers/clientToNodeTransformer.js";
import { ProposalFull as NProp, ORNodePropStatus } from "ortypes/ornode.js";
import { Bytes, EthAddress, PropId, ProposalNotCreated, ProposalState, TxHash, zVote as zNVote, DecodedError } from "ortypes";
import { Method, Path, Input, Response } from "./ornodeClient/ornodeClient.js";
import { sleep, stringify } from "ts-utils";
import { resultArrayToObj } from "ortypes/utils.js";
import { RespectAwardMt, RespectFungibleMt, TokenId } from "ortypes/respect1155.js";
import { Erc1155Mt } from "ortypes/erc1155.js";

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

export class ORClient {
  private _ctx: ORContext<ConfigWithOrnode>;
  private _nodeToClient: NodeToClientTransformer;
  private _clientToNode: ClientToNodeTransformer;
  private _cfg: Config;

  constructor(context: ORContext<ConfigWithOrnode>, cfg: Config = defaultConfig) {
    this._ctx = context;
    this._nodeToClient = new NodeToClientTransformer(this._ctx);
    this._clientToNode = new ClientToNodeTransformer(this._ctx);
    this._cfg = cfg;
  }

  /**
   * Return new instance that authors OREC transactions as `signer`.
   * @param signer - ethers.Signer implementation that should be used to sign transactions
   * @returns - new instance of ORClient.
   */
  connect(signer: Signer): ORClient {
    const newCtx = this._ctx.connect(signer);    
    return new ORClient(newCtx, this._cfg);
  }

  /**
   * Context for ORDAO. From it you can get components of ORDAO:
   * * Smart contracts;
   * * Contract runner;
   * * Used endpoints (for ORNode and Ethereum RPC API)
   */
  get context(): ORContext<ConfigWithOrnode> {
    return this._ctx;
  }

  /**
   * Returns proposal by its id.
   * @param id - proposal id
   * 
   * @example
   * await c.getProposal("0x2f5e1602a2e1ccc9cf707bc57361ae6587cd87e8ae27105cae38c0db12f4fab1")
   */
  async getProposal(id: PropId): Promise<Proposal> {
    //client.provide("get", "/v1/user/retrieve", { id: "10" });
    // const response = await ornodeClient.provide("post", "/v1/getProposal", { propId: id });
    const proposal = await this._ctx.ornode.getProposal(id);
    return this._nodeToClient.transformProp(proposal);
  }

  // TODO: add filters - e.g. to return only active proposals
  /**
   * Returns a list of proposals ordered from latest to oldest
   * 
   * @param spec - specification for query:
   * * `before` - oldest creation date for proposal. If specified, only proposals which were created up to this date will be returned;
   * * `limit` - maximum number of proposals to return. If not specified, it's up to ornode implementation.
   * * `execStatFilter` - list of ExecutionStatus values. Proposals which have execution status other than any of values in this list, will be filtered out. If undefined, then no filtering based on execution status is done.
   * * `voteStatFilter` - list of VoteStatus values. Proposals which have vote status other than any of values specified in the list will be filtered out (not returned). If undefined - no filtering based on vote status is done.
   * * `stageFilter` - list of Stage values. Proposals which are in stage other than any of stages specified in this list will be filtered out. If undefined - no filtering based on proposal stage is done.
   * @returns List of proposals
   * 
   * @example
   * await c.getProposals()
   */
  async getProposals(spec?: GetProposalsSpec): Promise<Proposal[]> {
    const nspec = this._clientToNode.transformGetProposalsSpec(spec ?? {});
    const nprops = await this._ctx.ornode.getProposals(nspec);
    const props: Proposal[] = [];
    for (const nprop of nprops) {
      const tprop = await this._nodeToClient.transformProp(nprop);

      const passExecStatFilter =
        spec?.execStatFilter === undefined ||
        spec.execStatFilter.includes(tprop.status);
      const passStageFilter = 
        spec?.stageFilter === undefined ||
        spec.stageFilter.includes(tprop.stage);
      const passVoteStatFilter =
        spec?.voteStatFilter === undefined ||
        spec.voteStatFilter.includes(tprop.voteStatus);

      if (passExecStatFilter && passStageFilter && passVoteStatFilter) {
        props.push(tprop);
      }
    }
    return props
  }

  /**
   * Vote on a proposal.
   * @param propId - id of a proposal to vote on.
   * @param vote - what to vote for.
   * * 'Yes' - vote for proposals;
   * * 'No' - vote against;
   * @param memo - memo text string to submit with proposal.
   * @returns hash of submitted transaction
   * 
   * @remarks Note that memo string with go with calldata of transaction, so longer string will cost more.
   * 
   * @example
   * await c.vote("0x2f5e1602a2e1ccc9cf707bc57361ae6587cd87e8ae27105cae38c0db12f4fab1", "Yes")
   */
  async vote(propId: PropId, vote: VoteType, memo?: string): Promise<TxHash>;
  /**
   * Vote on a proposal.
   * @param request - parameters for a vote as an object. See {@link ORConsole#vote}.
   * @returns hash of submitted transaction
   * 
   * @remarks Note that memo string with go with calldata of transaction, so longer string will cost more.
   * 
   * @example
   * await c.vote({
       propId: "0x2f5e1602a2e1ccc9cf707bc57361ae6587cd87e8ae27105cae38c0db12f4fab1",
       vote: "Yes",
       memo: "Optional memo"
     })
   */
  async vote(request: VoteRequest): Promise<TxHash>;
  async vote(pidOrReq: VoteRequest | PropId, vote?: VoteType, memo?: string): Promise<TxHash> {
    let req: VoteRequest;
    if (vote !== undefined && typeof pidOrReq === 'string') {
      req = { propId: pidOrReq, vote, memo }      
    } else {
      req = pidOrReq as VoteRequest;
    }
    const m = this._encodeMemo(req.memo);
    const v = this._clientToNode.transformVoteType(req.vote);
    const orec = this._ctx.orec;
    const errMsg = `orec.vote(${req.propId}, ${v}, ${m})`
    console.debug(errMsg);
    const promise = orec.vote(req.propId, v, m);
    return await this._handleTxPromise(promise, this._cfg.otherConfirms, errMsg);
  }

  // TODO: return proposal status and return value
  /**
   * Execute a passed proposal. Will fail if proposal is not passed yet.
   * @param propId - id of proposal to execute.
   * 
   * @example
   * await c.execute("0x2f5e1602a2e1ccc9cf707bc57361ae6587cd87e8ae27105cae38c0db12f4fab1")
   */
  async execute(propId: PropId) {
    const orec = this._ctx.orec;
    const nprop = await this._ctx.ornode.getProposal(propId);
    if (nprop.content !== undefined) {
      const errMsg = `orec.execute(${propId})`;
      const promise = orec.execute(nprop.content);
      await this._handleTxPromise(promise, this._cfg.otherConfirms, errMsg);
    }
  }

  /**
   * Create a proposal to award respect game participants of a single breakout room, based on results of that breakout room.
   * @param request - breakout room results, plus optional metadata.
   * @param vote - vote to submit with the result. Default: `{ vote: "Yes" }`.
   * @returns resulting proposal and its status.
   * 
   * @remarks 
   * The respect amounts to award are calculated automatically based on rankings:
   * * Level 6 - 55
   * * Level 5 - 34
   * * Level 4 - 21
   * * Level 3 - 13
   * * Level 2 - 8
   * * Level 1 - 5
   * 
   * The actual onchain proposal is just for minting Respect according to distribution above.
   * 
   * If `vote` parameter is not specified "Yes" vote is submitted.
   * If you want to make this proposal but don't want to vote for it, specify `{ vote: "None" }`.
   * 
   * @example
   * 
     await c.proposeBreakoutResult(
       {
         meetingNum: 1,
         groupNum: 1,
         rankings: [
           "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
           "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
           "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
           "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
         ]
       },
       {
         memo: "Some memo",
         vote: "Yes"
       }
     )
   */
  async proposeBreakoutResult(
    request: RespectBreakoutRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<PutProposalRes> {
    console.debug("submitting breakout result");
    const v = zVoteWithProp.parse(vote); 
    console.debug("parsed vote");
    const proposal = await this._clientToNode.transformRespectBreakout(request);
    return await this._submitProposal(proposal, v);
  }

  /**
   * Propose to mint a single Respect award to a single account.
   * 
   * @param req - specification for the Respect award, plus optional metadata.
   * @param vote - vote to submit with the result. Default: `{ vote: "Yes" }`.
   * @returns resulting proposal and its status.
   * 
   * @remarks
   * If `vote` parameter is not specified "Yes" vote is submitted.
   * If you want to make this proposal but don't want to vote for it, specify `{ vote: "None" }`.
   * 
   * @example
   * await c.proposeRespectTo({
       meetingNum: 1,
       mintType: 1,
       account: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
       value: 10n,
       title: "Reward Title",
       reason: "Reward reason"
    })
   */
  async proposeRespectTo(
    req: RespectAccountRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 
    console.debug("parsed vote")
    const proposal = await this._clientToNode.transformRespectAccount(req);
    console.debug("transformed proposal")
    return await this._submitProposal(proposal, v);
  }

  /**
   * Create a proposal to burn a single Respect award.
   * @param req - specification for the award to burn, plus optional metadata.
   * @param vote - vote to submit with the result. Default: `{ vote: "Yes" }`.
   * @returns resulting proposal and its status.
   * 
   * @remarks
   * If `vote` parameter is not specified "Yes" vote is submitted.
   * If you want to make this proposal but don't want to vote for it, specify `{ vote: "None" }`.
   * 
   * @example
   * await c.proposeBurnRespect(
   *   {
   *     tokenId: "0x000000010000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
   *     reason: "some optional reason"
   *   },
   *   {
   *       memo: "Some memo",
   *       vote: "Yes"
   *   }
   * );
   */
  async proposeBurnRespect(
    req: BurnRespectRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 
    const proposal = await this._clientToNode.transformBurnRespect(req);
    return await this._submitProposal(proposal, v);
  }

  /**
   * Create a proposal to issue a custom signal event from OREC contract.
   */
  async proposeCustomSignal(
    req: CustomSignalRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 
    const proposal = await this._clientToNode.transformCustomSignal(req);
    return await this._submitProposal(proposal, v);
  }

  /**
   * Create a proposal to issue a tick signal. Tick signals increment the period / meeting number returned by orclient (see {@link ORConsole#getPeriodNum}).
   * 
   * @param req - optional metadata to submit with a tick signal
   * @param vote - vote to submit with the result. Default: `{ vote: "Yes" }`.
   * @returns resulting proposal and its status.
   * 
   * @remarks
   * If `vote` parameter is not specified "Yes" vote is submitted.
   * If you want to make this proposal but don't want to vote for it, specify `{ vote: "None" }`.
   * 
   * @example
   * await c.proposeTick();
   */
  async proposeTick(
    req: TickRequest = {},
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 

    if (req.data === undefined) {
      req.data = toBeHex(await this.getNextMeetingNum());
    }

    const proposal = await this._clientToNode.transformTick(req);
    return await this._submitProposal(proposal, v);
  }

  /**
   * Create a proposal to an EVM call to some contract.
   * 
   * @param req - specification for the EVM message to send.
   * @param vote - vote to submit with the result. Default: `{ vote: "Yes" }`.
   * @returns resulting proposal and its status.
   * 
   * @remarks
   * If `vote` parameter is not specified "Yes" vote is submitted.
   * If you want to make this proposal but don't want to vote for it, specify `{ vote: "None" }`.
   */
  async proposeCustomCall(
    req: CustomCallRequest,
    vote: VoteWithPropRequest = { vote: "Yes" }
  ): Promise<PutProposalRes> {
    const v = zVoteWithProp.parse(vote); 
    const proposal = await this._clientToNode.transformCustomCall(req);
    return await this._submitProposal(proposal, v);
  }

  /**
   * Get vote of an account on a proposal.
   * 
   * @param propId - proposal id
   * @param voter - voter
   */
  async getVote(propId: PropId, voter: EthAddress): Promise<Vote> {
    const vote = zNVote.parse(await this._ctx.orec.votes(propId, voter));
    console.debug("vote: ", vote);
    return this._nodeToClient.transformVote(vote);
  }


  /**
   * Get old Respect an account has.
   */
  async getOldRespectOf(account: EthAddress): Promise<bigint> {
    return await this._ctx.oldRespect.balanceOf(account);
  }

  /**
   * Get Respect an account has
   */
  async getRespectOf(account: EthAddress): Promise<bigint> {
    return await this._ctx.newRespect.respectOf(account);
  }

  /**
   * Get period number (incremented using ticks see {@link ORConsole#proposeTick}).
   */
  async getPeriodNum(): Promise<number> {
    return await this._ctx.ornode.getPeriodNum();
  }

  /**
   * Get next meeting number (which is current period number + 1).
   */
  async getNextMeetingNum(): Promise<number> {
    return await this.getPeriodNum() + 1;
  }
  /**
   * Get last meeting number (which is equal to current period number).
   */
  async getLastMeetingNum(): Promise<number> {
    return await this.getPeriodNum();
  }

  /**
   * Get metadata of specific token. The token can be fungible Respect token or Respect award token (NTT).
   * 
   * @param tokenId - id of a token.
   * @param opts - additional options for retrieval function. default: { burned: true }.
   * 
   * @remarks
   * If `tokenId` is an id of a burned token, this function might return a metadata for token which is burned onchain.
   * Pass `{ burned: false }` as `opts` parameter to change this behaviour.
   */
  async getToken(tokenId: TokenId, opts?: GetTokenOpts): Promise<Erc1155Mt> {
    // TODO: fix type for ornode
    return await this._ctx.ornode.getToken(tokenId, opts);
  }

  /**
   * Get metadata of specific Respect award NTT.
   * 
   * @param tokenId - id of a token.
   * @param opts - additional options for retrieval function. default: { burned: true }.
   * 
   * @remarks
   * If `tokenId` is an id of a burned token, this function might return a metadata for token which is burned onchain.
   * Pass `{ burned: false }` as `opts` parameter to change this behaviour.
   */
  async getAward(tokenId: TokenId, opts?: GetTokenOpts): Promise<RespectAwardMt> {
    // TODO: fix type for ornode
    return await this._ctx.ornode.getAward(tokenId, opts);
  }

  /**
   * Get metadata of fungible non-transferrable Respect token.
   */
  async getRespectMetadata(): Promise<RespectFungibleMt> {
    return await this._ctx.ornode.getRespectMetadata();
  }

  // TODO: getAwards function where account would be as filter (as opts)
  // and opts would additionally have limit parameter
  /**
   * Get metadata of Respect awards for specific account.
   * 
   * @param account - account which received the awards
   * @param opts - additional options for retrieval function. default: { burned: false }.
   * 
   * @remarks
   * By default this function does not return metadata for tokens which are burned onchain.
   * Pass `{ burned: true }` as `opts` parameter to change this behaviour.
   */
  async getAwardsOf(account: EthAddress, opts?: GetTokenOpts): Promise<RespectAwardMt[]> {
    return await this._ctx.ornode.getAwardsOf(account, opts);
  }

  private _encodeMemo(memo?: string): Bytes {
    return memo !== undefined && memo != "" ? hexlify(toUtf8Bytes(memo)) : "0x";
  }

  private async _submitProposal(proposal: NProp, vote?: VoteWithProp): Promise<PutProposalRes> {
    console.debug("submitting to chain: ", proposal);
    const txId = await this._submitPropToChain(proposal, vote);
    proposal.createTxHash = txId;
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
          console.log("Submitting proposal to ornode failed with error ProposalNotCreated. Attempt count: ", attempts, ". Proposal: ", stringify(proposal));
        } else {
          throw error;
        }
      }
    }
    console.error("Attempt limit for submitting proposal exceeded.");
    throw _err;
  }

  private async _submitPropToChain(proposal: NProp, vote?: VoteWithProp) {
    const errMsg = `Submitting proposal: ${stringify(proposal)}`;
    const resp = this._submitPropTx(proposal, vote);
    return await this._handleTxPromise(resp, this._cfg.propConfirms, errMsg);
  }
  private async _submitPropTx(proposal: NProp, vote?: VoteWithProp) {
    if (vote !== undefined && vote.vote !== "None") {
      const v = this._clientToNode.transformVoteType(vote.vote);
      return this._ctx.orec.vote(
          proposal.id,
          v,
          this._encodeMemo(vote.memo)
      );
    } else {
      return this._ctx.orec.propose(proposal.id);
    }
  }

  private async _handleTxPromise(
    promise: Promise<ContractTransactionResponse>,
    confirms: number,
    errMsg?: string
  ): Promise<TxHash> {
    let resp: Awaited<typeof promise>;
    let receipt: Awaited<ReturnType<typeof resp.wait>>;
    try {
      resp = await promise;
      console.debug("Tx response: ", resp);
      receipt = await resp.wait(confirms);
      console.debug("Tx receipt: ", receipt);
    } catch(err) {
      let decoded: DecodedError;
      try {
        decoded = await this._ctx.errorDecoder.decode(err);
      } catch(err2) {
        throw new TxFailed(err2, undefined, `Error decoding error. errMsg: ${errMsg}`);
      }
      throw new TxFailed(err, decoded, errMsg);
    }
    if (receipt === null || receipt.status !== 1) {
      throw new TxFailed(resp, receipt, errMsg);
    }
    return resp.hash;
  }

  // TODO: function to list respect NTTs
}