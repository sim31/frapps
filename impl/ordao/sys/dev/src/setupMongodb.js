import { MongoClient } from "mongodb";

async function main() {
  try {
    const client = new MongoClient("mongodb://localhost:27017");
    console.debug("ok");
    const db = client.db("ornode");
    // TODO: create indexes
    await db.createCollection("proposals");
    console.debug("ok 1");
    await db.createCollection("ticks");
    console.debug("ok 2");

    await client.close()
  } catch (err) {
    console.error(err);
  }
}

main();
