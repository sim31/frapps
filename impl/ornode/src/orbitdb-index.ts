// import { createLibp2p } from 'libp2p'
// import { createHelia } from 'helia'
// import { LevelBlockstore } from 'blockstore-level'
// import { Libp2pOptions } from '../config/libp2p.js'

// const { createOrbitDB, Identities }  = require("@orbitdb/core");

// export async function initDb() {
//   // Create an IPFS instance.
//   const blockstore = new LevelBlockstore('./ipfs/blocks')
//   const libp2p = await createLibp2p(Libp2pOptions)
//   const ipfs = await createHelia({ libp2p, blockstore })

//   const id = 'userA'
//   const identities = await Identities()
//   // const identity = identities.createIdentity({ id })

//   const orbitdb = await createOrbitDB({ ipfs, identities, id: "userA" })

//   const db = await orbitdb.open("key-value-indexed", { type: ""})

//   console.log('my-db address', db.address)

//   // Add some records to the db.
//   // await db.add('hello world 4')

//   // Print out the above records.
//   console.log(await db.all())

//   // Close your db and stop OrbitDB and IPFS.
//   await db.close()
//   await orbitdb.stop()
//   await ipfs.stop()

// }
