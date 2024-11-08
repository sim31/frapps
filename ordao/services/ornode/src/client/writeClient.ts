import { Integration } from "express-zod-api";
import { routing } from "../routing.js";
import { ErrorWithCause, stringify } from "@sim31/ts-utils";
import fs from "fs/promises";

export async function writeClient(path: string): Promise<void> {
  const client = new Integration({
    routing,
    variant: "client", // <— optional, see also "types" for a DIY solution
    optionalPropStyle: { withQuestionMark: true, withUndefined: true }, // optional
    splitResponse: false, // optional, prints the positive and negative response types separately
  });

  const tsClientCode = await client.printFormatted(); // or just .print() for unformatted

  try {
    fs.writeFile(path, tsClientCode);
    console.log("Generated ornodeClient.ts as ", path);
  } catch (err) {
    const newErr = new ErrorWithCause(`Failed writing tmp/ornodeClient.ts. Error message: ${stringify(err)}`, err);
    throw newErr;
  }
}



