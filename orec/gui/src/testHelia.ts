// Create a simple .car file with a single block and that block's CID as the
// single root. Then read the .car and fetch the block again.

// import fs from 'node:fs'
// import { Readable } from 'node:stream'
import { CarReader, CarWriter } from '@ipld/car'
import * as raw from 'multiformats/codecs/raw'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
// import { Car } from '@helia/car'

async function carWriterOutToBlob(iterable: AsyncIterable<Uint8Array>) {
  const parts = []
  for await (const part of iterable) {
    parts.push(part)
  }
  return new Blob(parts, { type: 'application/car' })
}

async function blobToArray(blob: Blob): Promise<Uint8Array> {
  const reader = blob.stream().getReader();
  let done = false;
  const buff: number[] = [];
  while (!done) {
    const res = await reader.read()
    done = res.done;
    if (res.value !== undefined) {
      for (const val of res.value) {
        buff.push(val);        
      }
    } else {
      done = true;
    }
  }
  return new Uint8Array(buff);

}

console.log("ok")

export async function example() {
  const bytes = new TextEncoder().encode('random meaningless bytes')
  const hash = await sha256.digest(raw.encode(bytes))
  CID.create
  const cid = CID.create(1, raw.code, hash)

  // create the writer and set the header with a single root
  const { writer, out } = await CarWriter.create([cid])
  // Readable.from(out).pipe(fs.createWriteStream('example.car'))

  const carBlob = carWriterOutToBlob(out);

  console.log("ok")
  // store a new block, creates a new file entry in the CAR archive
  await writer.put({ cid, bytes })
  console.log("ok2");
  await writer.close();

  // read and parse the entire stream in one go, this will cache the contents of
  // the car in memory so is not suitable for large files.
  const reader = await CarReader.fromBytes(await blobToArray(await carBlob));

  // read the list of roots from the header
  const roots = await reader.getRoots()
  // retrieve a block, as a { cid:CID, bytes:UInt8Array } pair from the archive
  const got = await reader.get(roots[0])
  // also possible: for await (const { cid, bytes } of CarIterator.fromIterable(inStream)) { ... }

  if (got !== undefined) {
    console.log(
      'Retrieved [%s] from example.car with CID [%s]',
      new TextDecoder().decode(got.bytes),
      roots[0].toString()
    )
  } else {
    console.log("undefined")
  }
}

example().catch((err) => {
  console.error(err)
  process.exit(1)
})