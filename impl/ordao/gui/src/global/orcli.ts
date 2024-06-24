import { orclient } from "./orclient.js";
import { ORCli } from "orclient/orcli.js";

async function create() {
  const cl = await orclient;
  const cli = new ORCli(cl);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).cli = cli;
}

create();
