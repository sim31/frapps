import { expect } from "chai";
import {
  EthAddress,
  OrecContract,
  Respect1155,
  ORContext,
  IORNode,
  PropId,
  isEthAddr,
  FractalRespect,
  zSignalType,
  zTickSignalType,
  ProposalInvalid,
  ProposalNotCreated,
  ProposalNotFound,
  OrecFactory,
  Url,
  Bytes32,
  zValueToRanking,
  TokenNotFound
} from "ortypes/index.js"
import { ORNodePropStatus, Proposal, ProposalFull, ProposalValid, Tick, zORNodePropStatus, zProposal, zProposalValid } from "ortypes/ornode.js";
import { JsonRpcProvider, Provider, toBeHex, toBigInt, ZeroAddress } from "ethers";
import { MongoClient } from "mongodb";
import { ProposalService } from "./mongodb/proposalService.js";
import { TickService } from "./mongodb/tickService.js";
import { ProposalEntity, TickEvent } from "./mongodb/entities.js";
import { BigNumberish } from "ethers";
import { BurnData, RespectAwardMt, RespectFungibleMt, TokenId, unpackTokenId } from "ortypes/respect1155.js";
import { TokenMtCfg } from "./config.js";
import { RespectTokenService } from "./mongodb/respectTokenService.js";
import { Erc1155Mt } from "ortypes/erc1155.js";
import { stringify } from "ts-utils";


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
  mongoUrl?: Url
  dbName?: string
}

export const configDefaults = {
  mongoUrl: 'mongodb://localhost:27017',
  dbName: "ornode"
}

type ORNodeContextConfig = Omit<ORContext.Config, "ornode">;

type ORContext = ORContext.ORContext<ORNodeContextConfig>;

export class IllegalEvent extends Error {
  event: any;

  constructor(event: any, message: string) {
    super(`${message}. Event: ${event}`);
    this.name = "IllegalEvent";
    this.event = event;
  }
}

/**
 * TODO: Currently this class only saves proposals which are created onchain after
 * it starts running. This means that it will miss any proposals that happened before ORNode was launched.
 * TODO: Would be good to have a method to delete proposals which dot get any
 * weighted votes during voteTime, to save resources against spam.
 */
export class MongoOrnode implements IORNode {
  // value might be null if proposal has been submitted onchain but not to us
  private _ctx: ORContext;
  private _cfg: ConstructorConfig;
  private _mgClient: MongoClient;
  private _propService: ProposalService;
  private _tickService: TickService;
  private _tokenService: RespectTokenService;

  private static _fungibleId = 0n;

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

  private constructor(
    orcontext: ORContext,
    mongoClient: MongoClient,
    propService: ProposalService,
    tickService: TickService,
    tokenService: RespectTokenService,
    config: ConstructorConfig,
  ) {
    this._ctx = orcontext;
    this._cfg = config;
    this._mgClient = mongoClient;
    this._propService = propService;
    this._tickService = tickService;
    this._tokenService = tokenService;

    this._ctx.orec.on(this._ctx.orec.getEvent("ProposalCreated"), async (propId, event) => {
      console.debug("ProposalCreated event. PropId: ", propId, "event: ", event);

      try {
        const { txHash } = this._parseEventObject(event);
        const { createTime } = await this._ctx.orec.proposals(propId);

        const prop: Proposal = {
          id: propId,
          createTs: Number(createTime),
          createTxHash: txHash
        };
        await this._propService.createProposal(prop);
        console.debug(`stored proposal id: ${propId}`);
      } catch (error) {
        console.error("Erorr while handling ProposalCreated event for prop ", propId, "Error: ", error);
      }
    });

    const onExec = async (eventName: string, propId: PropId, retVal: string, txHash?: string) => {
      try {
        await this._propService.updateProposal(
          propId,
          { executeTxHash: txHash }
        )
      } catch (err) {
        console.error("Error while handling event ", eventName, ". Error: ", err);
      }
    }

    this._ctx.orec.on(this._ctx.orec.getEvent("Executed"), async (propId, retVal, event) => {
      console.debug("Exec event. PropId: ", propId, ", event: ", event);
      const { txHash } = this._parseEventObject(event);
      await onExec(event.eventName, propId, retVal, txHash);
    });

    this._ctx.orec.on(this._ctx.orec.getEvent("ExecutionFailed"), async (propId, retVal, event) => {
      console.debug("ExecutionFailed event. PropId: ", propId, ", event: ", event);
      const { txHash } = this._parseEventObject(event);
      await onExec(event.eventName, propId, retVal, txHash);
    });

    this._ctx.orec.on(this._ctx.orec.getEvent("Signal"), async (signalType, data, event) => {
      console.log("Signal event. signalType: ", signalType, "data: ", data, "event: ", event);

      try {
        const { txHash } = this._parseEventObject(event);

        const st = zSignalType.parse(signalType);
        if (st === zTickSignalType.value) {
          const tick: TickEvent = { txHash };
          await this._tickService.createTick(tick);
        } else {
          this._onSignal(st, data);
        }
      } catch(err) {
        console.error("Error while handling Signal event: ", err);
      }
    });

    const transferBatchEv = this._ctx.newRespect.getEvent("TransferBatch");
    const transferSingleEv = this._ctx.newRespect.getEvent("TransferSingle");
    this._ctx.newRespect.on(transferBatchEv, this._handleTransferEvent.bind(this));
    this._ctx.newRespect.on(transferSingleEv, this._handleSingleTransferEvent.bind(this));
  }

  private async _handleSingleTransferEvent(
    operator: EthAddress,
    from: EthAddress,
    to: EthAddress,
    id: BigNumberish,
    value: BigNumberish,
    event: any
  ) {
    await this._handleTransferEvent(
      operator, from, to, [id], [value], event
    );
  }

  private async _handleTransferEvent(
    operator: EthAddress,
    from: EthAddress,
    to: EthAddress,
    ids: BigNumberish[],
    values: BigNumberish[],
    event: any
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
        if (id !== MongoOrnode._fungibleId) {
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
      await this._tokenService.createAwards(awards);
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
        if (id !== MongoOrnode._fungibleId) {
          tokenIds.push(toBeHex(idsVal, 32));
        }
      }
      
      await this._tokenService.burnAwards(tokenIds, burnData);
    } else {
      throw new IllegalEvent(event, "Received transfer event which is neither mint nor burn.");
    }
  }

  private static async _connectToDb(
    config: Config
  ): Promise<{
    mgClient: MongoClient,
    propService: ProposalService,
    tickService: TickService,
    tokenService: RespectTokenService
  }> {
    const url = config.mongoUrl ?? configDefaults.mongoUrl;
    const dbName = config.dbName ?? configDefaults.dbName;
    const mgClient = new MongoClient(url);
    await mgClient.connect();

    const propService = new ProposalService(mgClient, dbName);
    const tickService = new TickService(mgClient, dbName);
    const tokenService = new RespectTokenService(mgClient, dbName);

    return { mgClient, propService, tickService, tokenService }
  }

  static async create(config: Config): Promise<MongoOrnode> {
    const { mgClient, propService, tickService, tokenService } =
      await MongoOrnode._connectToDb(config);

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

    const ornode = new MongoOrnode(ctx, mgClient, propService, tickService, tokenService, cfg);

    return ornode
  }

  private _onSignal(signalType: number, data: string) {
    console.log(`Signal! Type: ${signalType}, data: ${data}`);
  }

  async putProposal(proposal: ProposalFull): Promise<ORNodePropStatus> {
    let propValid: ProposalValid;
    try {
      propValid = zProposalValid.parse(proposal);
    } catch (err) {
      throw new ProposalInvalid(proposal, err);
    }

    const exProp = await this._propService.findProposal(proposal.id);
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
      await this._propService.updateProposal(exProp.id, updated)
      return zORNodePropStatus.Enum.ProposalStored;
    }
  } 

  async getProposal(id: PropId): Promise<Proposal> {
    const exProp = await this._propService.findProposal(id);
    if (exProp === null) {
      // TODO: check if proposal is created onchain. If so then return Proposal with unknown fields as undefined
      throw new ProposalNotFound(id);
    } else {
      return exProp;
    }
  }

  // TODO: Couple of problems:
  // First, this currently does not implement it correctly as interface suggests.
  // It currently only returns last `limit` of proposals, ignoring `from`.
  // Second, this is a bad interface anyway, because this API does not expose
  // sequence numbers of proposals anywhere, so from clent's point of view `from`
  // is meaningless. Better make it a date
  async getProposals(from: number, limit: number): Promise<Proposal[]> {
    return await this._propService.lastProposals(limit);
  }

  // TODO:
  async getPeriodNum(): Promise<number> {
    this._ctx.callTest();
    const tickNum = await this._tickService.tickCount();
    return tickNum;
  }

  async getAward(tokenId: TokenId): Promise<RespectAwardMt> {
    if (toBigInt(tokenId) === MongoOrnode._fungibleId) {
      throw new Error(`Invalid request: ${tokenId} is an id of a fungible token`);
    }
    const award = await this._tokenService.findAward(tokenId);
    if (award === null) {
      throw new TokenNotFound(tokenId);
    }
    return award;
  }

  async getRespectMetadata(): Promise<RespectFungibleMt> {
    return this._cfg.tokenCfg.fungible;
  }

  async getToken(tokenId: TokenId): Promise<RespectFungibleMt | RespectAwardMt> {
    if (toBigInt(tokenId) === MongoOrnode._fungibleId) {
      return await this.getRespectMetadata();
    } else {
      return await this.getAward(tokenId);
    }
  }

  async getAwardsOf(account: EthAddress): Promise<RespectAwardMt[]> {
    const awards = await this._tokenService.findAwardsOf(account);
    return awards;
  }

}