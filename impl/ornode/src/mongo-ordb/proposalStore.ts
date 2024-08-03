import { MongoClient, Db, ObjectId } from "mongodb";
import { PropId } from "ortypes";
import { IProposalStore, GetProposalsSpec, Proposal, zProposal } from "../ordb/iproposalStore.js";
import { withoutId } from "./utils.js";
import { withoutUndefined, stringify } from "ts-utils";

export type Config = {
  defaultDocLimit: number;
}

export const defaultConfig: Config = {
  defaultDocLimit: 50
};

export class ProposalStore implements IProposalStore {
  private readonly db: Db;
  private _cfg: Config;

  constructor(mongoClient: MongoClient, dbName: string, config: Config = defaultConfig) {
    this.db = mongoClient.db(dbName);
    this._cfg = config;
  }

  private get proposals() {
    return this.db.collection<Proposal>("proposals");
  }

  async getProposal(id: PropId): Promise<Proposal | null> {
    const doc = await this.proposals.findOne({ id: id });
    if (doc !== null) {
      console.debug("Retrieved proposal _id: ", doc._id, ", id: ", id);
      return zProposal.parse(withoutId(doc))
    } else {
      console.debug("Did not find proposal id: ", id);
      return null;
    }
  }

  /**
   * Returns proposals ordered from oldest to newest
   */
  async getProposals(spec: GetProposalsSpec): Promise<Proposal[]> {
    const filter: any = {};

    if (spec.before !== undefined) {
      filter['createTs'] = { $lte: spec.before }
    }

    const docs = await this.proposals.find(filter)
      .sort({ createTs: -1 })
      .limit(spec.limit ?? this._cfg.defaultDocLimit);
    const dtos = docs.map(ent => {
      return zProposal.parse(withoutId(ent));
    });

    const rval = await dtos.toArray();
    console.debug("Found docs for spec. Spec: ", stringify(spec), ". Count: ", rval.length);
    return rval;
  }

  async createProposal(prop: Proposal): Promise<void> {
    const res = await this.proposals.insertOne(withoutUndefined(prop));
    console.debug("Inserted proposal _id: ", res.insertedId);
  }

  async updateProposal(id: PropId, update: Partial<Proposal>): Promise<void> {
    console.debug("Updating proposal id ", id, " with: ", update);

    const newDoc = await this.proposals.findOneAndUpdate(
      { id },
      { $set: update },
      { returnDocument: "after" }
    );

    if (newDoc !== null) {
      console.debug("Updated proposal _id: ", newDoc._id);
    } else {
      console.debug("Failed to update proposal");
    }
  }

  async deleteProp(id: PropId): Promise<void> {
    const res = await this.proposals.deleteOne({ id });
    if (res.deletedCount === 1) {
      console.debug("Deleted proposal id ", id);
    } else {
      console.debug("Failed to delete proposal id", id);
    }
  }
}