import { MongoClient, Db, ObjectId } from "mongodb";
import { EthAddress } from "ortypes";
import { stringify, withoutUndefined } from "ts-utils";
import { IAwardStore, RespectAwardMt, TokenId, GetTokenOpts, zRespectAwardMt, BurnData } from "../ordb/iawardStore.js";
import { withoutId } from "./utils.js";

export class AwardStore implements IAwardStore {
  private readonly db: Db;

  constructor(mongoClient: MongoClient, dbName: string) {
    this.db = mongoClient.db(dbName);
  }

  private get awards() {
    return this.db.collection<RespectAwardMt>("awards");
  }

  async getAward(id: TokenId, opts: GetTokenOpts = { burned: true }): Promise<RespectAwardMt | null> {
    const filter = opts.burned === false
      ? { 
        "properties.tokenId": id,
        "properties.burn": null
      } : {
        "properties.tokenId": id,
      };
    const doc = await this.awards.findOne(filter);
    if (doc !== null) {
      console.debug("Retrieved award _id: ", doc._id, ", id: ", id);
      return zRespectAwardMt.parse(withoutId(doc));
    } else {
      console.debug("Did not find award id: ", id);
      return null;
    }
  }

  async getAwardsOf(recipient: EthAddress, opts: GetTokenOpts = { burned: false }): Promise<RespectAwardMt[]> {
    const filter = opts.burned === false
      ? { 
        "properties.recipient": recipient,
        "properties.burn": null
      } : {
        "properties.recipient": recipient
      };
    const cursor = await this.awards.find(filter);
    const awards = cursor.map(entity => zRespectAwardMt.parse(withoutId(entity)));

    const rval = await awards.toArray();
    console.debug("Found docs for spec. Spec: ", stringify(opts), ". Count: ", rval.length);
    return rval;
  }

  async createAwards(awards: RespectAwardMt[]): Promise<void> {
    const _awards = awards.map(award => zRespectAwardMt.parse(withoutUndefined(award)));
    try {
      console.debug("Inserting: ", JSON.stringify(_awards));
      await this.awards.insertMany(_awards);
    } catch (err: any) {
      if (err.result?.result?.insertedIds !== undefined) {
        console.error(`A MongoBulkWriteException occurred, but there are successfully processed documents.`);
        let ids = err.result.result.insertedIds;
        for (let id of Object.values(ids)) {
          console.log(`Processed a document with id ${(id as any)._id}`);
        }
        console.log(`Number of documents inserted: ${err.result.result.nInserted}`);
      }

      throw err;
    }
  }

  async deleteAwards(tokenIds: TokenId[]): Promise<void> {
    const result = await this.awards.deleteMany({
      "properties.tokenId": { $in: tokenIds }
    });
    console.log(`Requested to delete: ${tokenIds}. Delete count: ${result.deletedCount}`);
  }

  async burnAwards(tokenIds: TokenId[], burnData: BurnData): Promise<void> {
    const filter = { "properties.tokenId": { $in: tokenIds } };
    const update = { $set: { "properties.burn": burnData } };
    const result = await this.awards.updateMany(filter, update);
    console.log(`Requested to burn: ${tokenIds}. Burn data: ${JSON.stringify(burnData)}, modified count: ${result.modifiedCount}`);
  }

}