import { MongoClient, Db, ObjectId } from "mongodb";
import { ProposalEntity, zProposalEntity } from "./entities.js";
import { zPropEntityToProp } from "./transformers/entityToNode.js";
import { PropId } from "ortypes";
import { Proposal } from "ortypes/ornode.js";
import { Optional } from "utility-types";
import { zProposalToEntity } from "./transformers/nodeToEntity.js";

export class ProposalService {
  private readonly db: Db;

  constructor(mongoClient: MongoClient, dbName: string) {
    this.db = mongoClient.db(dbName);
  }

  private get proposals() {
    return this.db.collection<ProposalEntity>("proposals");
  }

  async findProposal(id: PropId): Promise<Proposal | null> {
    const entity = await this.proposals.findOne({ id: id });
    return entity !== null ? zPropEntityToProp.parse(entity) : null;
  }

  async lastProposals(limit: number = 50): Promise<Proposal[]> {
    const entities = await this.proposals.find().sort({ createTs: -1 }).limit(limit);
    // TODO: more efficient way to do this?
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