// import { ORClient } from "orclient";
// import { ORContext, ConfigWithOrnode } from "ortypes/orContext.js";
// import { config } from "./config.js"
import { ConfigWithOrnode } from "ortypes/orContext.js";
import { config } from "./config.ts";
import { RemoteOrnode, ORClient } from "orclient";
import { BrowserProvider } from "ethers";
import { ORContext } from "ortypes/orContext.js";

const ornode: RemoteOrnode = new RemoteOrnode(config.ornodeUrl);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ethereum: any = (window as any).ethereum;
ethereum.request({ method: "eth_requestAccounts", params: [] });

const bp = new BrowserProvider(ethereum)

const ctxCfg: ConfigWithOrnode = {
  orec: config.contracts.orec,
  newRespect: config.contracts.newRespect,
  ornode,
  contractRunner: bp
}
const ctx = ORContext.create<ConfigWithOrnode>(ctxCfg);

ctx.catch((reason) => {
  console.error(`Failed creating orContext. Reason: ${JSON.stringify(reason)}`);
})

export const orclient = ctx.then((context) => {
  console.debug("is a 2: ", context instanceof ORContext)
  context.callTest();
  const orclient = new ORClient(context);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).cli = orclient;

  return orclient;
})

