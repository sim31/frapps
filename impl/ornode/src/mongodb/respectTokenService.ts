import { MongoClient, Db, ObjectId } from "mongodb";
import { ProposalEntity, RespectAwardEntity, zProposalEntity } from "./entities.js";
import { zPropEntityToProp, zRAwardEntityToAward } from "./transformers/entityToNode.js";
import {
  EthAddress,
  PropId,
} from "ortypes";
import {
  Proposal,
  GetTokenOpts as NGetTokenOpts,
} from "ortypes/ornode.js";
import { Optional } from "utility-types";
import { zProposalToEntity, zRespectAwardToEntity } from "./transformers/nodeToEntity.js";
import { RespectAwardMt, TokenId, BurnData } from "ortypes/respect1155.js";
import { stringify } from "ts-utils";

export type GetAwardOpts = NGetTokenOpts;

export class RespectTokenService {
  private readonly db: Db;

  constructor(mongoClient: MongoClient, dbName: string) {
    this.db = mongoClient.db(dbName);
  }

  private get awards() {
    return this.db.collection<RespectAwardEntity>("awards");
  }

  async findAward(id: TokenId, opts: GetAwardOpts = { burned: true }): Promise<RespectAwardMt | null> {
    const filter = opts.burned === false
      ? { 
        "properties.tokenId": id,
        "properties.burn": null
      } : {
        "properties.tokenId": id,
      };
    const entity = await this.awards.findOne(filter);
    console.debug("found award: ", stringify(entity));
    return entity !== null ? zRAwardEntityToAward.parse(entity) : null;
  }

  async findAwardsOf(recipient: EthAddress, opts: GetAwardOpts = { burned: false }): Promise<RespectAwardMt[]> {
    const filter = opts.burned === false
      ? { 
        "properties.recipient": recipient,
        "properties.burn": null
      } : {
        "properties.recipient": recipient
      };
    const entities = await this.awards.find(filter);
    const awards = entities.map(entity => zRAwardEntityToAward.parse(entity));
    return await awards.toArray();
  }

  async createAwards(awards: RespectAwardMt[]): Promise<void> {
    const entities = awards.map(award => zRespectAwardToEntity.parse(award));
    try {
      console.debug("Inserting: ", JSON.stringify(entities));
      await this.awards.insertMany(entities);
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