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
  TokenNotFound
} from "ortypes"
import { TokenMtCfg } from "./config.js"
import { IOrdb } from "./ordb/iordb.js";
import { ORContext } from "ortypes";
import { Proposal } from "./ordb/iproposalStore.js";
import { GetProposalsSpec, ORNodePropStatus, ProposalFull, ProposalValid, zORNodePropStatus, zProposalValid } from "ortypes/ornode.js";
import { TickEvent } from "./ordb/itickStore.js";
import { z } from "zod";
import {
  TransferBatchEvent,
  TypedListener as RTypedListener,
  unpackTokenId,
  TransferSingleEvent,
  TypedEventLog as RTypedEventLog,
  GetTokenOpts,
  RespectFungibleMt
} from "ortypes/respect1155.js";
import { BigNumberish, toBeHex, toBigInt, ZeroAddress } from "ethers";
import {
  RespectAwardMt,
  BurnData,
  TokenId
} from "./ordb/iawardStore.js";
import { expect } from "chai";
import { stringify } from "ts-utils";

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

export class ORNode implements IORNode {
  private _db: IOrdb;
  private _ctx: ORContext;
  private _cfg: ConstructorConfig

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

  async getProposals(spec: GetProposalsSpec): Promise<Proposal[]> {
    return await this._db.proposals.getProposals(spec);
  }

  // TODO:
  async getPeriodNum(): Promise<number> {
    this._ctx.callTest();
    const tickNum = await this._db.ticks.tickCount();
    return tickNum;
  }

  async getAward(
    tokenId: TokenId,
    opts?: GetTokenOpts
  ): Promise<RespectAwardMt> {
    if (toBigInt(tokenId) === this._ctx.fungibleId) {
      throw new Error(`Invalid request: ${tokenId} is an id of a fungible token`);
    }
    const award = await this._db.awards.getAward(tokenId, opts);
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
    tokenId: TokenId,
    opts?: GetTokenOpts
  ): Promise<RespectFungibleMt | RespectAwardMt> {
    if (toBigInt(tokenId) === this._ctx.fungibleId) {
      return await this.getRespectMetadata();
    } else {
      return await this.getAward(tokenId, opts);
    }
  }

  async getAwardsOf(
    account: EthAddress,
    opts?: GetTokenOpts
  ): Promise<RespectAwardMt[]> {
    const awards = await this._db.awards.getAwardsOf(account, opts);
    return awards;
  }

  private _registerEventHandlers() {
    const orec = this._ctx.orec;

    orec.on(orec.getEvent("ProposalCreated"), this._propCreatedHandler);
    orec.on(orec.getEvent("Executed"), this._propExecHandler);
    orec.on(orec.getEvent("ExecutionFailed"), this._propExecFailedHandler);
    orec.on(orec.getEvent("Signal"), this._signalEventHandler);
    
    const resp = this._ctx.newRespect;
    resp.on(resp.getEvent("TransferBatch"), this._transferBatchHandler);
    resp.on(resp.getEvent("TransferSingle"), this._transferSingleHandler);
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

  private _propExecHandler: TypedListener<ExecutedEvent.Event> =
    async (
      propId: string,
      retVal: string,
      event: TypedEventLog<ExecutedEvent.Event>
    ) => {
      console.debug("Exec event. PropId: ", propId, ", event: ", event);
      const { txHash } = this._parseEventObject(event);
      await this._onExec(event.eventName, propId, retVal, txHash);
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

  private _transferSingleHandler: RTypedListener<TransferSingleEvent.Event> =
    async (
      operator, from, to, id, value, event
    ) => {
      await this._handleTransferEvent(
        operator, from, to, [id], [value], event
      )      
    }

  private _transferBatchHandler: RTypedListener<TransferBatchEvent.Event> =
    async (
      operator, from, to, ids, values, event
    ) => {
      await this._handleTransferEvent(
        operator, from, to, ids, values, event
      );
    }

  private async _handleTransferEvent(
    operator: EthAddress,
    from: EthAddress,
    to: EthAddress,
    ids: BigNumberish[],
    values: BigNumberish[],
    event: RTypedEventLog<TransferBatchEvent.Event> | RTypedEventLog<TransferSingleEvent.Event>
  ) {
    const { txHash } = this._parseEventObject(event);

    console.debug(`Handling transfer event. from: ${from}, to: ${to}, ids: ${ids}, values: ${values}, tx: ${txHash}`);

    if (from === ZeroAddress && to !== ZeroAddress) {
      // A mint
      const awards: RespectAwardMt[] = [];
      for (let [index, idsVal] of ids.entries()) {
        const val = values[index];
        if (val === undefined) {
          throw new IllegalEvent(event, "values and ids do not match");
        }

        const id = toBigInt(idsVal);
        console.debug("id: ", id);
        if (id !== this._ctx.fungibleId) {
          if (toBigInt(val) !== 1n) {
            throw new IllegalEvent(event, "value in event should be 1")
          }
          const denomination = await this._ctx.newRespect.valueOfToken(idsVal);
          const levelRes = zValueToRanking.safeParse(denomination);
          console.debug("levelRes: ", levelRes);

          const tData = unpackTokenId(idsVal);
          awards.push({
            name: this._cfg.tokenCfg.award.name,
            description: this._cfg.tokenCfg.award.description,
            image: this._cfg.tokenCfg.award.image,
            // TODO: derive and store: datetime, groupNum, reason, title
            // TODO: retrieve execute event from the same transaction
            // then retrieve groupNum, reason and title from the proposal executed. For time and date get date of transaction.
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
      console.debug("creating awards: ", JSON.stringify(awards));
      await this._db.awards.createAwards(awards);
    } else if (from !== ZeroAddress && to === ZeroAddress) {
      // Should not delete a burned token
      // Use case: key rotation. When rotating keys you should burn old tokens and issue new, but you would like to have old token metadata for historical record.

      // TODO: retrieve burnReason
      const burnData: BurnData = {
        burnTxHash: txHash
      };

      const tokenIds: TokenId[] = [];
      for (let [index, idsVal] of ids.entries()) {
        const val = values[index];
        if (val === undefined) {
          throw new IllegalEvent(event, "values and ids do not match");
        }

        const id = toBigInt(idsVal);
        console.debug("id: ", id);
        if (id !== this._ctx.fungibleId) {
          tokenIds.push(toBeHex(idsVal, 32));
        }
      }

      await this._db.awards.burnAwards(tokenIds, burnData);
    } else {
      throw new IllegalEvent(event, "Received transfer event which is neither mint nor burn.");
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