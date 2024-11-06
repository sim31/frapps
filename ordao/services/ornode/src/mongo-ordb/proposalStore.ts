import { MongoClient, Db, ObjectId } from "mongodb";
import { PropId, TxHash } from "ortypes";
import { IProposalStore, GetProposalsSpec, Proposal, zProposal } from "../ordb/iproposalStore.js";
import { withoutId } from "./utils.js";
import { withoutUndefined, stringify } from "ts-utils";
import { StoreConfig, zStoreConfig } from "./storeConfig.js";
import { z } from "zod";

export const zProposalStoreConfig = z.object({
  defaultDocLimit: z.number().int().gt(0).default(10),
  maxDocLimit: z.number().int().gt(0).default(50)
})
export type ProposalStoreConfig = z.infer<typeof zProposalStoreConfig>;

export class ProposalStore implements IProposalStore {
  private readonly db: Db;
  private _cfg: ProposalStoreConfig;

  constructor(
    mongoClient: MongoClient,
    dbName: string,
    config: ProposalStoreConfig
  ) {
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
      filter['createTs'] = { $lt: spec.before }
    }

    if (spec.execStatusFilter !== undefined && spec.execStatusFilter.length > 0) {
      filter['status'] = { $in: spec.execStatusFilter }
    }

    const limit = spec.limit ? Math.min(spec.limit, this._cfg.maxDocLimit) : this._cfg.defaultDocLimit;

    const docs = await this.proposals.find(filter)
      .sort({ createTs: -1 })
      .limit(limit);
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

    const res = await this.proposals.updateOne(
      { id },
      { $set: update },
    );

    if (res.modifiedCount !== 1) {
      throw new Error(`Failed to update proposal: ${id}`);
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