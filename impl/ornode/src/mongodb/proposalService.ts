import { MongoClient, Db, ObjectId } from "mongodb";
import { ProposalDTO, ProposalEntity, zPropDTOToEntity, zProposalEntity, zProposalEntityToDTO, zProposalEntityToProposal } from "./types.js";
import { PropId } from "ortypes";

export class ProposalService {
  private readonly db: Db;

  constructor(mongoClient: MongoClient, dbName: string) {
    this.db = mongoClient.db(dbName);
  }

  private get proposals() {
    return this.db.collection<ProposalEntity>("proposals");
  }

  async findProposal(id: PropId): Promise<ProposalDTO | null> {
    const entity = await this.proposals.findOne({ id: id });
    return entity !== null ? zProposalEntityToDTO.parse(entity) : null;
  }

  async lastProposals(limit: number = 50): Promise<ProposalDTO[]> {
    const entities = await this.proposals.find().sort({ createTs: -1 }).limit(limit);
    // TODO: more efficient way to do this?
    const dtos = entities.map(ent => {
      return zProposalEntityToDTO.parse(ent);
    });
    return await dtos.toArray();
  }

  async createProposal(dto: ProposalDTO): Promise<ProposalDTO> {
    const entity = zPropDTOToEntity.parse(dto);
    const { insertedId } = await this.proposals.insertOne(entity);
    return zProposalEntityToDTO.parse({ ...dto, _id: insertedId });
  }

  async updateProposal(id: PropId, dto: Partial<ProposalDTO>): Promise<ProposalDTO | null> {
    const candidate = zProposalEntity.partial().parse(dto);
    delete candidate["_id"];
    console.debug("Updating proposal with: ", candidate);

    const newEntity = await this.proposals.findOneAndUpdate(
      { id },
      { $set: candidate },
      { returnDocument: "after" }
    );
    return newEntity ? zProposalEntityToDTO.parse(newEntity) : null;
  }

  async deleteUser(id: PropId): Promise<void> {
    await this.proposals.deleteOne({ id });
  }
}