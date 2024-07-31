import { MongoClient, Db, ObjectId } from "mongodb";
import { ProposalEntity, zProposalEntity } from "./entities.js";
import { zPropEntityToProp } from "./transformers/entityToNode.js";
import { PropId } from "ortypes";
import { GetProposalsSpec, Proposal } from "ortypes/ornode.js";
import { Optional } from "utility-types";
import { zProposalToEntity } from "./transformers/nodeToEntity.js";

export type Config = {
  defaultDocLimit: number;
}

export const defaultConfig: Config = {
  defaultDocLimit: 50
};

export class ProposalService {
  private readonly db: Db;
  private _cfg: Config;

  constructor(mongoClient: MongoClient, dbName: string, config: Config = defaultConfig) {
    this.db = mongoClient.db(dbName);
    this._cfg = config;
  }

  private get proposals() {
    return this.db.collection<ProposalEntity>("proposals");
  }

  async findProposal(id: PropId): Promise<Proposal | null> {
    const entity = await this.proposals.findOne({ id: id });
    return entity !== null ? zPropEntityToProp.parse(entity) : null;
  }

  /**
   * Returns proposals ordered from oldest to newest
   */
  async getProposals(spec: GetProposalsSpec): Promise<Proposal[]> {
    const filter: any = {};

    if (spec.before !== undefined) {
      filter['createTs'] = { $lte: spec.before }
    }

    const entities = await this.proposals.find(filter)
      .sort({ createTs: -1 })
      .limit(spec.limit ?? this._cfg.defaultDocLimit);
    const dtos = entities.map(ent => {
      return zPropEntityToProp.parse(ent);
    });
    return await dtos.toArray();
  }

  async createProposal(prop: Proposal): Promise<Proposal> {
    const entity = zProposalToEntity.parse(prop);
    await this.proposals.insertOne(entity);
    return zPropEntityToProp.parse(entity);
  }

  async updateProposal(id: PropId, prop: Partial<Proposal>): Promise<Proposal | null> {
    const candidate = zProposalEntity.partial().parse(prop);
    delete candidate["_id"];
    console.debug("Updating proposal with: ", candidate);

    const newEntity = await this.proposals.findOneAndUpdate(
      { id },
      { $set: candidate },
      { returnDocument: "after" }
    );
    return newEntity ? zPropEntityToProp.parse(newEntity) : null;
  }

  async deleteProp(id: PropId): Promise<void> {
    await this.proposals.deleteOne({ id });
  }
}