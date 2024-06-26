import { MongoClient, Db, ObjectId } from "mongodb";
import { ProposalDTO, ProposalEntity, TickDTO, TickEntity, zPropDTOToEntity, zProposalEntity, zProposalEntityToDTO, zProposalEntityToProposal, zTickDTOToEntity, zTickEntityToDTO } from "./types.js";
import { PropId } from "ortypes";

export class TickService {
  private readonly db: Db;

  constructor(mongoClient: MongoClient, dbName: string) {
    this.db = mongoClient.db(dbName);
  }

  private get ticks() {
    return this.db.collection<TickEntity>("ticks");
  }

  async tickCount(): Promise<number> {
    return await this.ticks.countDocuments();
  }

  // async findLatest(): Promise<TickDTO | null> {
  //   const entity = await this.ticks.find().sort({ num: -1 }).limit(1);
  //   return entity !== null ? zTickEntityToDTO.parse(entity) : null;
  // }

  async createTick(dto: TickDTO): Promise<TickDTO> {
    const entity = zTickDTOToEntity.parse(dto);
    const { insertedId } = await this.ticks.insertOne(entity);
    return zTickEntityToDTO.parse({ ...dto, _id: insertedId });
  }

}