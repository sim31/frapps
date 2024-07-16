import { MongoClient, Db, ObjectId } from "mongodb";
import { PropId } from "ortypes";
import { TickEntity, TickEvent, zTickEntity } from "./entities.js";
import { zTickToEntity } from "./transformers/nodeToEntity.js";
import { Optional } from "utility-types";

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

  async createTick(tick: TickEvent): Promise<TickEvent> {
    const entity = zTickToEntity.parse(tick);
    await this.ticks.insertOne(entity);
    return tick;
  }

}