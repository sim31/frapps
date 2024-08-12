import { Db, MongoClient } from "mongodb";
import { IVoteStore, Vote, GetVotesSpec, zVote } from "../ordb/ivoteStore.js";
import { PropId } from "ortypes";
import { stringify, withoutUndefined } from "ts-utils";
import { withoutId } from "./utils.js";

export type VoteStoreConfig = {
  defaultDocLimit: number;
}

export const defaultConfig: VoteStoreConfig = {
  defaultDocLimit: 50
};

export class VoteStore implements IVoteStore {
  private readonly db: Db;
  private _cfg: VoteStoreConfig;

  constructor(
    mongoClient: MongoClient,
    dbName: string,
    config: VoteStoreConfig = defaultConfig
  ) {
    this.db = mongoClient.db(dbName);
    this._cfg = config;
  }

  private get votes() {
    return this.db.collection<Vote>("votes");
  }

  async getVotes(spec: GetVotesSpec): Promise<Vote[]> {
    const filter: any = {};

    if (spec.before !== undefined) {
      filter['ts'] = { $lt: spec.before }
    }

    if (spec.propFilter !== undefined && spec.propFilter.length > 0) {
      filter['proposalId'] = { $in: spec.propFilter }
    }

    if (spec.voterFilter !== undefined && spec.voterFilter.length > 0) {
      filter['voter'] = { $in: spec.voterFilter };
    }

    if (spec.minWeight !== undefined) {
      filter['weight'] = { $gte: spec.minWeight };
    }

    if (spec.voteType !== undefined) {
      filter['vote'] = { $eq: spec.voteType }
    }

    const docs = await this.votes.find(filter)
      .sort({ ts: -1 })
      .limit(spec.limit ?? this._cfg.defaultDocLimit);
    const cursor = docs.map(ent => {
      return zVote.parse(withoutId(ent));
    });

    const rval = await cursor.toArray();
    console.debug("Found docs for getVotes spec. Spec: ", stringify(spec), ". Count: ", rval.length);
    return rval;
  }

  async createVote(vote: Vote): Promise<void> {
    const res = await this.votes.insertOne(withoutUndefined(vote));
    console.debug("Inserted vote _id: ", res.insertedId);
  }

}