import { MongoClient } from "mongodb";
import { IOrdb } from "../ordb/iordb.js";
import { AwardStore } from "./awardStore.js";
import { ProposalStore } from "./proposalStore.js";
import { Url } from "ortypes/common.js";
import { TickStore } from "./tickStore.js";

export interface Config {
  mongoUrl?: Url
  dbName?: string
}

export const configDefaults = {
  mongoUrl: 'mongodb://localhost:27017',
  dbName: "ornode"
}

export class MongoOrdb implements IOrdb {
  private _awards: AwardStore;
  private _proposals: ProposalStore;
  private _mongoClient: MongoClient;
  private _ticks: TickStore;
  private _cfg: Config;

  private constructor(
    propStore: ProposalStore,
    awardStore: AwardStore,
    tickStore: TickStore,
    mongoClient: MongoClient,
    config: Config
  ) {
    this._mongoClient = mongoClient;
    this._cfg = config;
    this._awards = awardStore;
    this._proposals = propStore;
    this._ticks = tickStore;
  }

  private static async _connectToDb(
    config: Config
  ): Promise<{
    mgClient: MongoClient,
    propStore: ProposalStore,
    tickStore: TickStore,
    awardStore: AwardStore
  }> {
    const url = config.mongoUrl ?? configDefaults.mongoUrl;
    const dbName = config.dbName ?? configDefaults.dbName;
    const mgClient = new MongoClient(url, { directConnection: true });
    await mgClient.connect();

    const propStore = new ProposalStore(mgClient, dbName);
    const tickStore = new TickStore(mgClient, dbName);
    const awardStore = new AwardStore(mgClient, dbName);

    return { mgClient, propStore, tickStore, awardStore }
  }

  static async create(config: Config = configDefaults): Promise<MongoOrdb> {
    const { mgClient, propStore, tickStore, awardStore } =
      await MongoOrdb._connectToDb(config);

    const ordb = new MongoOrdb(propStore, awardStore, tickStore, mgClient, config);

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
}