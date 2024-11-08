import { MongoClient, Db, ObjectId } from "mongodb";
import { ITickStore, TickEvent } from "../ordb/itickStore.js";
import { withoutUndefined } from "@sim31/ts-utils";

export class TickStore implements ITickStore {
  private readonly db: Db;

  constructor(mongoClient: MongoClient, dbName: string) {
    this.db = mongoClient.db(dbName);
  }

  private get ticks() {
    return this.db.collection<TickEvent>("ticks");
  }

  async tickCount(): Promise<number> {
    return await this.ticks.countDocuments();
  }

  // async findLatest(): Promise<TickDTO | null> {
  //   const entity = await this.ticks.find().sort({ num: -1 }).limit(1);
  //   return entity !== null ? zTickEntityToDTO.parse(entity) : null;
  // }

  async createTick(tick: TickEvent): Promise<void> {
    const res = await this.ticks.insertOne(withoutUndefined(tick));
    console.debug("Inserted tick _id: ", res.insertedId);
  }

}