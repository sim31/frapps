import {
  EthAddress,
  IORNode,
  OrecContract,
  Respect1155,
  Url,
  ProposalCreatedEvent,
  TypedListener,
  TypedEventLog,
  PropId,
  ExecutedEvent,
  ExecutionFailedEvent,
  SignalEvent,
  zSignalType,
  zTickSignalType,
  zValueToRanking,
  ProposalInvalid,
  ProposalNotCreated,
  ProposalNotFound,
  TokenNotFound,
  TxHash,
  zBytesLikeToBytes,
  zBreakoutMintRequest,
  zEthAddress,
  Timestamp,
  WeightedVoteInEvent,
  VoteStruct,
  VoteStructOut,
  zVoteType,
  EmptyVoteInEvent,
  VoteType,
  VoteTypeStr,
  zVoteTypeToStr,
  zBytes,
  zBytesToVoteMemo,
  ProposalRemovedEvent,
} from "ortypes"
import { TokenMtCfg } from "./config.js"
import { IOrdb } from "./ordb/iordb.js";
import { ORContext } from "ortypes";
import { Proposal } from "./ordb/iproposalStore.js";
import { GetAwardsSpec, GetProposalsSpec, GetVotesSpec, ORNodePropStatus, ProposalFull, ProposalValid, zORNodePropStatus, zProposalValid, Vote, VoteWeight, zVoteWeight } from "ortypes/ornode.js";
import { TickEvent } from "./ordb/itickStore.js";
import { string, z } from "zod";
import {
  TransferBatchEvent,
  TypedListener as RTypedListener,
  unpackTokenId,
  TransferSingleEvent,
  TypedEventLog as RTypedEventLog,
  RespectFungibleMt,
  zMintRespectArgs,
  zTokenIdNum,
  zTokenId,
  zFungibleTokenIdNum
} from "ortypes/respect1155.js";
import { BigNumberish, toBeHex, toBigInt, TransactionReceipt, ZeroAddress } from "ethers";
import {
  RespectAwardMt,
  BurnData,
  TokenId
} from "./ordb/iawardStore.js";
import { expect } from "chai";
import { stringify } from "ts-utils";
import { LogDescription } from "ethers";

export class IllegalEvent extends Error {
  event: any;

  constructor(event: any, message: string) {
    super(`${message}. Event: ${event}`);
    this.name = "IllegalEvent";
    this.event = event;
  }
}

export interface ConstructorConfig {
  /**
   * For how long a proposal without weighted votes will be stored. In seconds
   * @default: orec.votePeriod
   */
  weghtlessPropAliveness?: number,
  tokenCfg: TokenMtCfg
}

export interface Config extends ConstructorConfig {
  newRespect: EthAddress | Respect1155.Contract,
  orec: EthAddress | OrecContract,
  providerUrl?: Url,
}

type ORNodeContextConfig = Omit<ORContext.Config, "ornode">;
type ORContext = ORContext.ORContext<ORNodeContextConfig>;

interface BurnRequest {
  burnIds: TokenId[],
  burnData: BurnData
};

interface TransferEventData {
  args: TransferBatchEvent.OutputObject;
  log: LogDescription
}

export class ORNode implements IORNode {
  private _db: IOrdb;
  private _ctx: ORContext;
  private _cfg: ConstructorConfig
  
  private _tokUpdPool: Record<TokenId, Partial<RespectAwardMt['properties']>> = {};

  private constructor(
    orcontext: ORContext,
    db: IOrdb,
    config: ConstructorConfig,
  ) {
    this._db = db;
    this._cfg = config;
    this._ctx = orcontext;

    this._registerEventHandlers();
  }

  static async create(config: Config, db: IOrdb): Promise<ORNode> {
    const contextCfg: ORNodeContextConfig = {
      orec: config.orec,
      newRespect: config.newRespect,
      contractRunner: config.providerUrl
    };
    const ctx = await ORContext.ORContext.create(contextCfg);

    const propAliveness = config.weghtlessPropAliveness ?? Number(await ctx.orec.voteLen());

    const cfg: ConstructorConfig = {
      weghtlessPropAliveness: propAliveness,
      tokenCfg: config.tokenCfg
    }

    const ornode = new ORNode(ctx, db, cfg);

    return ornode
  }

  async putProposal(proposal: ProposalFull): Promise<ORNodePropStatus> {
    let propValid: ProposalValid;
    try {
      propValid = zProposalValid.parse(proposal);
    } catch (err) {
      throw new ProposalInvalid(proposal, err);
    }

    const exProp = await this._db.proposals.getProposal(proposal.id);
    if (exProp === null) {
      throw new ProposalNotCreated(proposal);
    }
    expect(exProp.id).to.be.equal(proposal.id);

    if (exProp.content !== undefined) {
      zProposalValid.parse(exProp);
      // If both proposals are valid and their id member is the same it means that proposals are equal
      // Return status saying that proposal already exists.
      return zORNodePropStatus.Enum.ProposalExists;
    } else {
      // IMPORTANT: Ignoring createTs, createTxHash, executeTxHash on purpose - this we are tracking here ourselves and zProposalValid currently does not check if those values are valid.
      const updated: Proposal = {
        ...exProp,
        content: proposal.content,
        attachment: proposal.attachment
      };
      await this._db.proposals.updateProposal(exProp.id, updated)
      return zORNodePropStatus.Enum.ProposalStored;
    }
  } 

  async getProposal(id: PropId): Promise<Proposal> {
    const exProp = await this._db.proposals.getProposal(id);
    if (exProp === null) {
      // TODO: check if proposal is created onchain. If so then return Proposal with unknown fields as undefined
      throw new ProposalNotFound(id);
    } else {
      return exProp;
    }
  }

  async getProposals(spec?: GetProposalsSpec): Promise<Proposal[]> {
    return await this._db.proposals.getProposals(spec ?? {});
  }

  // TODO:
  async getPeriodNum(): Promise<number> {
    // this._ctx.callTest();
    const tickNum = await this._db.ticks.tickCount();
    return tickNum;
  }

  async getAward(
    tokenId: TokenId,
  ): Promise<RespectAwardMt> {
    if (toBigInt(tokenId) === this._ctx.fungibleId) {
      throw new Error(`Invalid request: ${tokenId} is an id of a fungible token`);
    }
    const award = await this._db.awards.getAward(tokenId);
    if (award === null) {
      throw new TokenNotFound(tokenId);
    }
    console.debug("Retrieved award: ", stringify(award))
    return award;
  }

  async getRespectMetadata(): Promise<RespectFungibleMt> {
    return this._cfg.tokenCfg.fungible;
  }

  async getToken(
    tokenId: TokenId
  ): Promise<RespectFungibleMt | RespectAwardMt> {
    if (toBigInt(tokenId) === this._ctx.fungibleId) {
      return await this.getRespectMetadata();
    } else {
      return await this.getAward(tokenId);
    }
  }

  async getVotes(spec?: GetVotesSpec): Promise<Vote[]> {
    return await this._db.votes.getVotes(spec ?? {});
  }

  async getAwards(
    spec?: GetAwardsSpec
  ): Promise<RespectAwardMt[]> {
    const awards = await this._db.awards.getAwards(spec);
    return awards;
  }

  private _registerEventHandlers() {
    const orec = this._ctx.orec;

    orec.on(orec.getEvent("ProposalCreated"), this._propCreatedHandler);
    orec.on(orec.getEvent("Executed"), this._propExecHandler);
    orec.on(orec.getEvent("ExecutionFailed"), this._propExecFailedHandler);
    orec.on(orec.getEvent("Signal"), this._signalEventHandler);
    orec.on(orec.getEvent("WeightedVoteIn"), this._weightedVoteHandler);
    orec.on(orec.getEvent("EmptyVoteIn"), this._emptyVoteHandler);
    orec.on(orec.getEvent("ProposalRemoved"), this._proposalRemovedHandler);
  }

  private _proposalRemovedHandler: TypedListener<ProposalRemovedEvent.Event> =
    async (
      propId: PropId,
      event: TypedEventLog<ProposalRemovedEvent.Event>
    ) => {
      console.debug("ProposalRemoved event. PropId: ", propId, "event: ", stringify(event));

      const { txHash } = this._parseEventObject(event);
      if (txHash === undefined) {
        console.error("Was not able to retrieve tx hash in handler for event: ", stringify(event));

        await this._db.proposals.updateProposal(
          propId,
          { removed: true }
        );
      } else {
        await this._db.proposals.updateProposal(
          propId,
          { removed: true, removeTxHash: txHash }
        );
      }
  }
      
  private _weightedVoteHandler: TypedListener<WeightedVoteInEvent.Event> =
    async (
      propId: PropId,
      voter: EthAddress,
      vote: VoteStructOut,
      event: TypedEventLog<WeightedVoteInEvent.Event>
    ) => {
      console.debug("WeightedVoteIn event. PropId: ", propId, "event: ", stringify(event));

      await this._handleVoteEvent(
        propId, voter, zVoteTypeToStr.parse(vote.vtype), zVoteWeight.parse(vote.weight), event
      );
    }

  private _emptyVoteHandler: TypedListener<EmptyVoteInEvent.Event> =
    async (
      propId: PropId,
      voter: EthAddress,
      vtype: bigint,
      event: TypedEventLog<EmptyVoteInEvent.Event>
    ) => {
      console.debug("WeightedVoteIn event. PropId: ", propId, "event: ", stringify(event));

      await this._handleVoteEvent(
        propId, voter, zVoteTypeToStr.parse(vtype), 0, event
      );
    }

  private async _handleVoteEvent(
    propId: PropId,
    voter: EthAddress,
    voteType: VoteTypeStr,
    weight: VoteWeight,
    event: any
  ) {
    const v: Vote = {
      proposalId: propId,
      weight,
      voter,
      vote: voteType
    }

    const { txHash } = this._parseEventObject(event);
    if (txHash === undefined) {
      console.error("Was not able to retrieve tx hash in handler for event: ", stringify(event));
    } else {
      const receipt = await this._ctx.runner.provider?.getTransactionReceipt(txHash);
      if (receipt === undefined || receipt === null) {
        console.error("Not able to get tx needed in vote handler")
      } else {
        const b = await receipt.getBlock();
        v.ts = b.timestamp;

        // Get memo from transaction
        const tx = await receipt.getTransaction();
        const data = zBytesLikeToBytes.parse(tx.data);
        const ptx = this._ctx.orec.interface.parseTransaction({ data });
        z.literal('vote').parse(ptx?.name);
        const memoStr = zBytesToVoteMemo.parse(ptx?.args[2]);
        v.memo = memoStr;
      }
      v.txHash = txHash;
    }

    await this._db.votes.createVote(v);
  }

  private _propCreatedHandler: TypedListener<ProposalCreatedEvent.Event> =
    async (propId: string, event: TypedEventLog<ProposalCreatedEvent.Event>) => {
      console.debug("this properties: ", Object.getOwnPropertyNames(this));
      if (!(this instanceof ORNode)) {
        throw Error("this is not ORNOde");
      }

      console.debug("ProposalCreated event. PropId: ", propId, "event: ", event);

      try {
        const { txHash } = this._parseEventObject(event);
        const { createTime } = await this._ctx.orec.proposals(propId);

        const prop: Proposal = {
          id: propId,
          createTs: Number(createTime),
          createTxHash: txHash
        };
        await this._db.proposals.createProposal(prop);
      } catch (error) {
        console.error("Erorr while handling ProposalCreated event for prop ", propId, "Error: ", error);
      }
    }
  

  private _tokenEventsFromReceipt(
    receipt: TransactionReceipt
  ): TransferEventData[] {
    const events = new Array<TransferEventData>;
    const newRespect = this._ctx.newRespect;
    const tsingleSig = "TransferSingle(address,address,address,uint256,uint256)";
    const tbatchSig = "TransferBatch(address,address,address,uint256[],uint256[])";
    // The following two lines are for verification of signatures only
    const f1 = newRespect.filters[tsingleSig];
    const f2 = newRespect.filters[tbatchSig];
    for (const log of receipt.logs) {
      const ld = newRespect.interface.parseLog(log);
      if (ld?.signature === tbatchSig) {
        // Have to use indexes instead of arg names because 'values' arg name (last arg) does not work for some reason
        const operator = zEthAddress.parse(ld.args[0]);
        const from = zEthAddress.parse(ld.args[1]);
        const to = zEthAddress.parse(ld.args[2]);
        const ids = z.array(zTokenIdNum.or(zFungibleTokenIdNum)).parse(ld.args[3])
        const values = z.array(z.bigint()).parse(ld.args[4]);
        events.push({
          args: {
            operator, from, to, ids, values
          },
          log: ld
        });
      } else if (ld?.name === tsingleSig) {
        const operator = zEthAddress.parse(ld.args[0]);
        const from = zEthAddress.parse(ld.args[1]);
        const to = zEthAddress.parse(ld.args[2]);
        const id = zTokenIdNum.or(zFungibleTokenIdNum).parse(ld.args[3])
        const value = z.bigint().parse(ld.args[4]);
        events.push({
          args: {
            operator, from, to, ids: [id], values: [value]
          },
          log: ld
        });
      }
    }
    return events;
  }

  private async _handleTokenEvents(
    propId: PropId,
    retVal: string,
    event: TypedEventLog<ExecutedEvent.Event>,
    txHash?: TxHash,
  ) {
    // check if event being executed is breakout result or individual mint
    const prop = await this._db.proposals.getProposal(propId);
    if (!prop) {
      console.error("Could not find proposal that was executed: ", propId);
    }

    const propType = prop?.attachment?.propType;

    if (txHash === undefined) {
      const msg = "Could not retrieve tx hash needed to handle token events";
      if (propType === 'respectAccount' || propType === 'respectBreakout') {
        console.error(msg);
      } else {
        console.warn(msg);
      }
      return;
    }

    const receipt = await this._ctx.runner.provider?.getTransactionReceipt(txHash);
    if (!receipt) {
      throw new Error("Not able to get transaction receipt needed to handle token events")
    }

    const transferEvs = this._tokenEventsFromReceipt(receipt);
    console.debug("Found transfer events: ", stringify(transferEvs));

    if (transferEvs.length > 0) {
      const awards: Array<RespectAwardMt> = [];
      const burnRequests: BurnRequest[] = [];
      for (const { args, log } of transferEvs) {
        const op = await this._handleTransferEvent(
          args.operator,
          args.from,
          args.to,
          args.ids,
          args.values,
          log,
          txHash
        );
        if ('burnData' in op) {
          burnRequests.push(op);
        } else {
          awards.push(...op);
        }
      }

      let ts: Timestamp;
      const getTs = async () => {
        if (ts === undefined) {
          const block = await receipt.getBlock();
          ts = block.timestamp;
        }
        return ts;
      }

      if (propType === 'respectBreakout') {
        for (const award of awards) {
          award.properties = {
            ...award.properties,
            mintTs: await getTs(),
            mintTxHash: txHash,
            groupNum: prop?.attachment?.groupNum
          }
        }
      } else if (propType === 'respectAccount') {
        for (const award of awards) {
          award.properties = {
            ...award.properties,
            mintTs: await getTs(),
            reason: prop?.attachment?.mintReason,
            title: prop?.attachment?.mintTitle
          }
        }
      } else if (propType === 'burnRespect') {
        for (const req of burnRequests) {
          req.burnData = {
            ...req.burnData,
            burnReason: prop?.attachment?.burnReason
          };
        }
      }

      for (const req of burnRequests) {
        await this._db.awards.burnAwards(req.burnIds, req.burnData);
      }

      if (awards.length > 0) {
        await this._db.awards.createAwards(awards);
      }
    }
  }

  private _propExecHandler: TypedListener<ExecutedEvent.Event> =
    async (
      propId: string,
      retVal: string,
      event: TypedEventLog<ExecutedEvent.Event>
    ) => {
      console.debug("Exec event. PropId: ", propId, ", event: ", event);
      const { txHash } = this._parseEventObject(event);
      await this._onExec(event.eventName, propId, retVal, txHash);

      await this._handleTokenEvents(propId, retVal, event, txHash);
    }

  private _propExecFailedHandler: TypedListener<ExecutionFailedEvent.Event> =
    async (
      propId: string,
      retVal: string,
      event: TypedEventLog<ExecutionFailedEvent.Event>
    ) => {
      console.debug("ExecutionFailed event. PropId: ", propId, ", event: ", event);
      const { txHash } = this._parseEventObject(event);
      await this._onExec(event.eventName, propId, retVal, txHash);
    }

  private _signalEventHandler: TypedListener<SignalEvent.Event> =
    async (signalType, data, event) => {
      console.log("Signal event. signalType: ", signalType, "data: ", data, "event: ", event);

      try {
        const { txHash } = this._parseEventObject(event);

        const st = zSignalType.parse(signalType);
        if (st === zTickSignalType.value) {
          const tick: TickEvent = { txHash };
          await this._db.ticks.createTick(tick);
        } else {
          this._onSignal(st, data);
        }
      } catch(err) {
        console.error("Error while handling Signal event: ", err);
      }
    }

  private async _handleTransferEvent(
    operator: EthAddress,
    from: EthAddress,
    to: EthAddress,
    ids: BigNumberish[],
    values: BigNumberish[],
    logDesc: LogDescription,
    txHash?: TxHash
  ): Promise<RespectAwardMt[] | BurnRequest> {
    console.debug(`Handling transfer event. from: ${from}, to: ${to}, ids: ${ids}, values: ${values}, tx: ${txHash}`);

    if (from === ZeroAddress && to !== ZeroAddress) {
      // A mint
      const awards: RespectAwardMt[] = [];
      for (let [index, idsVal] of ids.entries()) {
        const val = values[index];
        if (val === undefined) {
          throw new IllegalEvent(logDesc, "values and ids do not match");
        }

        const id = toBigInt(idsVal);
        console.debug("id: ", id);
        if (id !== this._ctx.fungibleId) {
          if (toBigInt(val) !== 1n) {
            throw new IllegalEvent(logDesc, "value in event should be 1")
          }
          const denomination = await this._ctx.newRespect.valueOfToken(idsVal);
          const levelRes = zValueToRanking.safeParse(denomination);
          console.debug("levelRes: ", levelRes);

          const tData = unpackTokenId(idsVal);
          awards.push({
            name: this._cfg.tokenCfg.award.name,
            description: this._cfg.tokenCfg.award.description,
            image: this._cfg.tokenCfg.award.image,
            properties: {
              tokenId: toBeHex(idsVal, 32),
              recipient: tData.owner,
              mintType: Number(toBigInt(tData.mintType)),
              periodNumber: Number(toBigInt(tData.periodNumber)),
              denomination: Number(denomination),
              level: levelRes.success ? levelRes.data : undefined,
              mintTxHash: txHash,
              burn: null
            }
          })
        }
      }
      return awards;
    } else if (from !== ZeroAddress && to === ZeroAddress) {
      // Should not delete a burned token
      // Use case: key rotation. When rotating keys you should burn old tokens and issue new, but you would like to have old token metadata for historical record.

      const burnData: BurnData = {
        burnTxHash: txHash
      };

      const tokenIds: TokenId[] = [];
      for (let [index, idsVal] of ids.entries()) {
        const val = values[index];
        if (val === undefined) {
          throw new IllegalEvent(logDesc, "values and ids do not match");
        }

        const id = toBigInt(idsVal);
        console.debug("id: ", id);
        if (id !== this._ctx.fungibleId) {
          tokenIds.push(toBeHex(idsVal, 32));
        }
      }

      return { burnIds: tokenIds, burnData };
    } else {
      throw new IllegalEvent(logDesc, "Received transfer event which is neither mint nor burn.");
    }
  }

  private _onSignal(signalType: number, data: string) {
    console.log(`Signal! Type: ${signalType}, data: ${data}`);
  }

  private async _onExec(
    eventName: string,
    propId: PropId,
    retVal: string,
    txHash?: string
  ) {
    try {
      await this._db.proposals.updateProposal(
        propId,
        { executeTxHash: txHash }
      )
    } catch (err) {
      console.error("Error in _onExec ", eventName, ". Error: ", err);
    }
  }

  private _parseEventObject(obj: any): { txHash?: string } {
    // TODO: this is needed because I'm receiving an event parameter
    // of different type than typescript claims. Should figure out why this is
    try {
      if (obj.transactionHash && typeof obj.transactionHash === 'string') {
        return { txHash: obj.transactionHash }
      } else if (obj.log?.transactionHash && typeof obj.log.transactionHash === "string") {
        return { txHash: obj.log.transactionHash };
      } else {
        return {};
      }
    } catch (err) {
      console.error("Error in _parseEventObject: ", err);
      return {};
    }
  }


}