import { Signer, hexlify, toUtf8Bytes, ContractTransactionResponse, ContractTransactionReceipt, toBeHex } from "ethers";
import { BurnRespectRequest, CustomCallRequest, CustomSignalRequest, Proposal, RespectAccountRequest, RespectBreakoutRequest, TickRequest, VoteRequest, VoteWithProp, VoteWithPropRequest, zVoteWithProp, VoteType, Vote, GetProposalsSpec, GetAwardsSpec, ExecError, GetVotesSpec } from "ortypes/orclient.js";
import { TxFailed } from "./errors.js";
import {
  ORContext as ORContextOrig,
  ConfigWithOrnode,
} from "ortypes/orContext.js";
import { NodeToClientTransformer, zNVoteToClient } from "ortypes/transformers/nodeToClientTransformer.js";
import { ClientToNodeTransformer } from "ortypes/transformers/clientToNodeTransformer.js";
import { ProposalFull as NProp, ORNodePropStatus } from "ortypes/ornode.js";
import { Bytes, EthAddress, PropId, ProposalNotCreated, ProposalState, TxHash, zVote as zNVote, DecodedError, ExecutedEvent, ExecutionFailedEvent, zPropId, zBytes, encodeVoteMemo } from "ortypes";
import { Method, Path, Input, Response } from "./ornodeClient/ornodeClient.js";
import { sleep, stringify } from "ts-utils";
import { resultArrayToObj } from "ortypes/utils.js";
import { RespectAwardMt, RespectFungibleMt, TokenId } from "ortypes/respect1155.js";
import { Erc1155Mt } from "ortypes/erc1155.js";
import { z } from "zod";

// Re-define so that ORContext docs are included
export class ORContext extends ORContextOrig<ConfigWithOrnode> {}

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

export interface OnchainActionRes {
  txReceipt: ContractTransactionReceipt
}

export interface ProposeRes extends OnchainActionRes {
  proposal: Proposal,
  status: ORNodePropStatus
}

export type ExecRes = OnchainActionRes & {
  execStatus: "Executed"
} | OnchainActionRes & {
  execStatus: "ExecutionFailed"
  execError?: ExecError
};

/**
 * Docs...
 * AAA
 * BBB
 * CCC
 */
export class ORClient {
  private _ctx: ORContext;
  private _nodeToClient: NodeToClientTransformer;
  private _clientToNode: ClientToNodeTransformer;
  private _cfg: Config;

  constructor(context: ORContext, cfg: Config = defaultConfig) {
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
  get context(): ORContext {
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

  /**
   * Returns a list of proposals ordered from latest to oldest
   * 
   * @param spec - specification for query:
   * * `before` - newest possible creation date for proposal. If specified, only proposals which were created up to this date will be returned;
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
      let tprop: Proposal;
      try {
        tprop = await this._nodeToClient.transformProp(nprop);
      } catch (err: any) {
        // Sometimes ornode might store proposals which from our point of view are not onchain yet (it receives events quicker for some reason sometimes).
        // So if it is a fresh proposal and ornode returns it even though
        // it is not onchain then it is not a problem.
        // But if ornode returns an old proposal which is not onchain - then something is wrong with ornode.
        if (err.name === 'OnchainPropNotFound') {
          const now = Date.now() / 1000;
          if (nprop.createTs !== undefined && now - nprop.createTs < 20) {
            continue;
          } else if (nprop.removed) {
            // TODO: we might want to return removed proposals for history
            continue;
          }
        }
        throw err;
      }

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
   * 
   * @remarks Note that memo string with go with calldata of transaction, so longer string will cost more.
   * 
   * @example
   * await c.vote("0x2f5e1602a2e1ccc9cf707bc57361ae6587cd87e8ae27105cae38c0db12f4fab1", "Yes")
   */
  async vote(propId: PropId, vote: VoteType, memo?: string): Promise<OnchainActionRes>;
  /**
   * Vote on a proposal.
   * @param request - parameters for a vote as an object. See {@link ORClient#vote}.
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
  async vote(request: VoteRequest): Promise<OnchainActionRes>;
  async vote(pidOrReq: VoteRequest | PropId, vote?: VoteType, memo?: string): Promise<OnchainActionRes> {
    let req: VoteRequest;
    if (vote !== undefined && typeof pidOrReq === 'string') {
      req = { propId: pidOrReq, vote, memo }      
    } else {
      req = pidOrReq as VoteRequest;
    }
    const m = encodeVoteMemo(req.memo);
    const v = this._clientToNode.transformVoteType(req.vote);
    const orec = this._ctx.orec;
    const errMsg = `orec.vote(${req.propId}, ${v}, ${m})`
    console.debug(errMsg);
    const promise = orec.vote(req.propId, v, m);
    const txReceipt = await this._handleTxPromise(promise, this._cfg.otherConfirms, errMsg);
    return { txReceipt };
  }

  /**
   * Execute a passed proposal. Will fail if proposal is not passed yet.
   * @param propId - id of proposal to execute.
   * 
   * @example
   * await c.execute("0x2f5e1602a2e1ccc9cf707bc57361ae6587cd87e8ae27105cae38c0db12f4fab1")
   */
  async execute(propId: PropId): Promise<ExecRes> {
    const orec = this._ctx.orec;
    const nprop = await this._ctx.ornode.getProposal(propId);
    if (nprop.content !== undefined) {
      const errMsg = `orec.execute(${propId})`;
      const promise = orec.execute(nprop.content);
      const receipt = await this._handleTxPromise(promise, this._cfg.otherConfirms, errMsg);
      const ev = this._execEventFromReceipt(receipt);
      if (ev.name === "Executed") {
        return {
          txReceipt: receipt,
          execStatus: "Executed"
        }
      } else {
        const execStatus = z.literal("ExecutionFailed").parse(ev.name);
        const error = this._ctx.errorDecoder.decodeReturnData(ev.args.retVal);
        return {
          txReceipt: receipt,
          execStatus,
          execError: error
        }
      }
    } else {
      throw new Error("Don't have proposal content to execute");
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
  ): Promise<ProposeRes> {
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
  ): Promise<ProposeRes> {
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
  ): Promise<ProposeRes> {
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
  ): Promise<ProposeRes> {
    const v = zVoteWithProp.parse(vote); 
    const proposal = await this._clientToNode.transformCustomSignal(req);
    return await this._submitProposal(proposal, v);
  }

  /**
   * Create a proposal to issue a tick signal. Tick signals increment the period / meeting number returned by orclient (see {@link ORClient#getPeriodNum}).
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
  ): Promise<ProposeRes> {
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
  ): Promise<ProposeRes> {
    const v = zVoteWithProp.parse(vote); 
    const proposal = await this._clientToNode.transformCustomCall(req);
    return await this._submitProposal(proposal, v);
  }

  /**
   * Get amount of old Respect an account has.
   */
  async getOldRespectOf(account: EthAddress): Promise<bigint> {
    return await this._ctx.oldRespect.balanceOf(account);
  }

  /**
   * Get amount of Respect an account has.
   */
  async getRespectOf(account: EthAddress): Promise<bigint> {
    return await this._ctx.newRespect.respectOf(account);
  }

  /**
   * Get period number (incremented using ticks see {@link ORClient#proposeTick}).
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
   * 
   * @remarks
   * If `tokenId` is an id of a burned token, this function might return a metadata for token which is burned onchain.
   */
  async getToken(tokenId: TokenId): Promise<Erc1155Mt> {
    return await this._ctx.ornode.getToken(tokenId);
  }

  /**
   * Get metadata of specific Respect award NTT.
   * 
   * @param tokenId - id of a token.
   * 
   * @remarks
   * If `tokenId` is an id of a burned token, this function might return a metadata for token which is burned onchain.
   */
  async getAward(tokenId: TokenId): Promise<RespectAwardMt> {
    return await this._ctx.ornode.getAward(tokenId);
  }

  /**
   * Get metadata of fungible non-transferrable Respect token.
   */
  async getRespectMetadata(): Promise<RespectFungibleMt> {
    return await this._ctx.ornode.getRespectMetadata();
  }

  /**
   * Get information on votes submitted on proposals. Votes returned are sorted from newest to oldest.
   * 
   * @param spec - specification for a query
   * * `before` - newest possible date of a vote. If specified, only votes made up to this date will be returned.
   * * `limit` - maximum number of objects to return. If not specified it is up to implementation of ornode.
   * * `propFilter` - list of proposal ids. If specified, then only votes on proposals in this list are returned.
   * * `voterFilter` - list of ethereum addresses. If specified, only votes from this list of accounts are returned.
   * * `minWeight` - minimum vote weight. If specified, only votes which have equal or greater weight are returned.
   * * `voteType` - Yes / No. If specified only votes of specified type are returned.
   * 
   * @example
   * await c.getVotes({ 
      voterFilter: [ "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0xcd3B766CCDd6AE721141F452C550Ca635964ce71" ],
      propFilter: [ "0xcc55ee4f4b5d61a9b90b5a5d915d8e7edede19e26b1a68be043d837654313760" ],
      limit: 10,
      minWeight: 1
    })
   */
  async getVotes(spec?: GetVotesSpec): Promise<Vote[]> {
    const s = spec && this._clientToNode.transformGetVotesSpec(spec);
    const votes = await this._ctx.ornode.getVotes(s);
    return votes.map(v => zNVoteToClient.parse(v));
  }

  /**
   * Get metadata of Respect award NTTs, sorted from latest to oldest.
   * 
   * @param spec - specification for a query
   * * `before` - newest mint date for a token. If specified, only tokens which were created up to this date will be returned;
   * * `limit` - maximum number of tokens to return. If not specified, it's up to ornode implementation.
   * * `recipient` - recipient of the awards. If specified only awards which belong to this account are returned.
   * * `burned` - whether to return burned tokens or not. Default: false.
   * 
   * @returns list of token metadata objects sorted by mint datetime from latest to oldest.
   * 
   * @remarks
   * * By default this function does not return burned awards. Set `burned` in the spec to true to change this behaviour.
   * 
   * @example
   * await c.getAwards() // Return latest awards unfiltered
   * await c.getAwards({ before: new Date("2024-08-30T11:42:59.000Z"), limit: 50 }) // Return up to 50 awards that happened before the specified date
   * await c.getAwards({ recipient: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" }) // Get latest awards belonging to specified accounts
   */
  async getAwards(spec?: GetAwardsSpec): Promise<RespectAwardMt[]> {
    const nspec = this._clientToNode.transformGetAwardsSpec(spec ?? {});
    const awards = await this._ctx.ornode.getAwards(nspec);
    return awards;
  }

  private async _submitProposal(proposal: NProp, vote?: VoteWithProp): Promise<ProposeRes> {
    console.debug("submitting to chain: ", proposal);
    const receipt = await this._submitPropToChain(proposal, vote);
    proposal.createTxHash = receipt.hash;
    console.debug("submitting to ornode");
    const status = await this._submitPropToOrnode(proposal);
    console.debug("Submitted proposal id: ", proposal.id, "status: ", status);
    const cprop = await this._nodeToClient.transformProp(proposal);
    return {
      proposal: cprop,
      status,
      txReceipt: receipt
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
          encodeVoteMemo(vote.memo)
      );
    } else {
      return this._ctx.orec.propose(proposal.id);
    }
  }

  private async _handleTxPromise(
    promise: Promise<ContractTransactionResponse>,
    confirms: number,
    errMsg?: string
  ): Promise<ContractTransactionReceipt> {
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
    return receipt;
  }

  private _execEventFromReceipt(
    receipt: ContractTransactionReceipt
  ): {
    name: "Executed" | "ExecutionFailed",
    args: ExecutedEvent.OutputObject | ExecutionFailedEvent.OutputObject
  } {

    const execSig = "Executed(bytes32,bytes)";
    const execFailedSig = "ExecutionFailed(bytes32,bytes)";
    const _c1 = this._ctx.orec.filters[execSig];
    const _c2 = this._ctx.orec.filters[execFailedSig];

    const events: ReturnType<ORClient["_execEventFromReceipt"]>[] = [];
    for (const log of receipt.logs) {
      const ld = this._ctx.orec.interface.parseLog(log);
      if (ld?.signature === execSig) {
        events.push({
          name: "Executed",
          args: {
            propId: zPropId.parse(ld.args[0]),
            retVal: zBytes.parse(ld.args[1]),
          }
        })
      } else if (ld?.signature === execFailedSig) {
        events.push({
          name: "ExecutionFailed",
          args: {
            propId: zPropId.parse(ld.args[0]),
            retVal: zBytes.parse(ld.args[1])
          }
        })
      }
    }

    if (events.length > 1) {
      throw new Error(`More than one exec event in tx. Receipt: ${stringify(receipt)}. Events: ${stringify(events)}`);
    } else if (events.length < 1) {
      throw new Error("Execution did not trigger any exec events");
    } else {
      return events[0];
    }
  }
}