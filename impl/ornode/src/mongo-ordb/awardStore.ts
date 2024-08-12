import { MongoClient, Db, ObjectId } from "mongodb";
import { EthAddress } from "ortypes";
import { stringify, withoutUndefined } from "ts-utils";
import { IAwardStore, RespectAwardMt, TokenId, zRespectAwardMt, BurnData } from "../ordb/iawardStore.js";
import { withoutId } from "./utils.js";
import { GetAwardsSpec } from "ortypes/ornode.js";

export type AwardStoreConfig = {
  defaultDocLimit: number;
}

const defaultConfig: AwardStoreConfig = {
  defaultDocLimit: 50
};

export class AwardStore implements IAwardStore {
  private readonly db: Db;
  private _cfg: AwardStoreConfig;

  constructor(
    mongoClient: MongoClient,
    dbName: string,
    config: AwardStoreConfig = defaultConfig
  ) {
    this.db = mongoClient.db(dbName);
    this._cfg = config;
  }

  private get awards() {
    return this.db.collection<RespectAwardMt>("awards");
  }

  async getAward(id: TokenId): Promise<RespectAwardMt | null> {
    const filter = {
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

  async getAwards(spec?: GetAwardsSpec): Promise<RespectAwardMt[]> {
    const filter: any = {};

    const burned = spec?.burned || false;
    if (!burned) {
      filter['properties.burn'] = null;
    }
    if (spec?.before !== undefined) {
      filter['properties.mintTs'] = { $lt: spec.before };
    }
    if (spec?.recipient !== undefined) {
      filter['properties.recipient'] = spec.recipient;
    }

    const cursor = await this.awards.find(filter)
      .sort({ "properties.mintTs": -1 })
      .limit(spec?.limit ?? this._cfg.defaultDocLimit);

    const awards = cursor.map(entity => zRespectAwardMt.parse(withoutId(entity)));

    const rval = await awards.toArray();
    console.debug("Found docs for spec. Spec: ", stringify(spec), ". Count: ", rval.length);

    return rval;
  }

  // async getAwardsOf(recipient: EthAddress, opts: GetTokenOpts = { burned: false }): Promise<RespectAwardMt[]> {
  //   const filter = opts.burned === false
  //     ? { 
  //       "properties.recipient": recipient,
  //       "properties.burn": null
  //     } : {
  //       "properties.recipient": recipient
  //     };
  //   const cursor = await this.awards.find(filter);
  //   const awards = cursor.map(entity => zRespectAwardMt.parse(withoutId(entity)));

  //   const rval = await awards.toArray();
  //   console.debug("Found docs for spec. Spec: ", stringify(opts), ". Count: ", rval.length);
  //   return rval;
  // }

  async createAwards(awards: RespectAwardMt[]): Promise<void> {
    const _awards = awards.map(award => zRespectAwardMt.parse(withoutUndefined(award)));
    try {
      console.debug("Inserting: ", JSON.stringify(_awards));
      const res = await this.awards.insertMany(_awards);
      if (res.insertedCount !== awards.length) {
        throw new Error(`Failed inserting awards: ${stringify(awards)}`);
      }
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
    if (result.deletedCount !== tokenIds.length) {
      throw new Error("Failed to delete requested docs");
    }
  }

  async burnAwards(tokenIds: TokenId[], burnData: BurnData): Promise<void> {
    const filter = { "properties.tokenId": { $in: tokenIds } };
    const update = { $set: { "properties.burn": burnData } };
    const result = await this.awards.updateMany(filter, update);
    console.debug(`Requested to burn: ${tokenIds}. Burn data: ${JSON.stringify(burnData)}, modified count: ${result.modifiedCount}`);
    if (result.modifiedCount !== tokenIds.length) {
      throw new Error(`Failed to burn awards. tokenIds: ${stringify(tokenIds)}, burnData: ${burnData}`);
    }
  }

}