// import { ORClient } from "orclient";
// import { ORContext, ConfigWithOrnode } from "ortypes/orContext.js";
// import { config } from "./config.js"
import { ConfigWithOrnode } from "ortypes/orContext.js";
import { config } from "./config.ts";
import { RemoteOrnode, ORClient } from "orclient";
import { BrowserProvider } from "ethers";
import { ORContext } from "ortypes/orContext.js";

export async function create(): Promise<ORClient> {
  const ornode: RemoteOrnode = new RemoteOrnode(config.ornodeUrl);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ethereum: any = (window as any).ethereum;

  const bp = new BrowserProvider(ethereum)

  const signer = await bp.getSigner();

  const ctxCfg: ConfigWithOrnode = {
    orec: config.contracts.orec,
    newRespect: config.contracts.newRespect,
    ornode,
    contractRunner: signer
  }
  const ctx = await ORContext.create<ConfigWithOrnode>(ctxCfg);

  const orclient = new ORClient(ctx);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).orclient = orclient;

  return orclient;
}

create().then(orclient => { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).orclient = orclient
}).catch(reason => {
  console.error("Error creating orclient: ", reason);
})

