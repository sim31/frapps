import { MongoClient } from "mongodb";
import { IOrdb } from "../ordb/iordb.js";
import { AwardStore, AwardStoreConfig } from "./awardStore.js";
import { ProposalStore, ProposalStoreConfig } from "./proposalStore.js";
import { Url } from "ortypes/common.js";
import { TickStore } from "./tickStore.js";
import { VoteStore, VoteStoreConfig } from "./voteStore.js";

export interface Config {
  mongoUrl: Url
  dbName: string,
  propStoreConfig: ProposalStoreConfig,
  voteStoreConfig: VoteStoreConfig,
  awardStoreConfig: AwardStoreConfig
}

export class MongoOrdb implements IOrdb {
  private _awards: AwardStore;
  private _proposals: ProposalStore;
  private _ticks: TickStore;
  private _votes: VoteStore;
  private _mongoClient: MongoClient;
  private _cfg: Config;

  private constructor(
    propStore: ProposalStore,
    awardStore: AwardStore,
    tickStore: TickStore,
    voteStore: VoteStore,
    mongoClient: MongoClient,
    config: Config
  ) {
    this._mongoClient = mongoClient;
    this._cfg = config;
    this._awards = awardStore;
    this._proposals = propStore;
    this._ticks = tickStore;
    this._votes = voteStore;
  }

  private static async _connectToDb(
    config: Config,
  ): Promise<{
    mgClient: MongoClient,
    propStore: ProposalStore,
    tickStore: TickStore,
    awardStore: AwardStore,
    voteStore: VoteStore
  }> {
    const url = config.mongoUrl
    const dbName = config.dbName;
    const mgClient = new MongoClient(url);
    await mgClient.connect();

    const propStore = new ProposalStore(mgClient, dbName, config.propStoreConfig);
    const tickStore = new TickStore(mgClient, dbName);
    const awardStore = new AwardStore(mgClient, dbName, config.voteStoreConfig);
    const voteStore = new VoteStore(mgClient, dbName, config.awardStoreConfig);

    return { mgClient, propStore, tickStore, awardStore, voteStore }
  }

  static async create(
    config: Config,
  ): Promise<MongoOrdb> {
    const { mgClient, propStore, tickStore, awardStore, voteStore } =
      await MongoOrdb._connectToDb(config);

    const ordb = new MongoOrdb(
      propStore,
      awardStore,
      tickStore,
      voteStore,
      mgClient,
      config
    );

    return ordb;
  }

  get awards() {
    return this._awards;
  }

  get proposals() {
    return this._proposals;
  }

  get ticks() {
    return this._ticks;
  }

  get votes() {
    return this._votes;
  }
}