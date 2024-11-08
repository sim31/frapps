// import { ORClient } from "orclient";
// import { ORContext, ConfigWithOrnode } from "ortypes/orContext.js";
// import { config } from "./config.js"
import { ConfigWithOrnode } from "ortypes/orContext.js";
import { config } from "./config.ts";
import { RemoteOrnode, ORClient } from "orclient";
import { BrowserProvider } from "ethers";
import { ORContext } from "ortypes/orContext.js";
import { stringify } from "@sim31/ts-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function switchChain(ethereum: any) {
  try {
    await ethereum // Or window.ethereum if you don't support EIP-6963.
      .request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: config.chainInfo.chainId }],
      })
  } catch (err) {
    // This error code indicates that the chain has not been added to MetaMask.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof err === 'object' && (err as any)?.code === 4902) {
      await ethereum // Or window.ethereum if you don't support EIP-6963.
        .request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: config.chainInfo.chainId,
              chainName: config.chainInfo.chainName,
              rpcUrls: config.chainInfo.rpcUrls,
              blockExplorerUrls: [config.chainInfo.blockExplorerUrl],
              nativeCurrency: config.chainInfo.nativeCurrency
            },
          ],
        })
      }
    }
}


export async function create(): Promise<ORClient> {
  const ornode: RemoteOrnode = new RemoteOrnode(config.ornodeUrl);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ethereum: any = (window as any).ethereum;

  await switchChain(ethereum);

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
  (window as any).c = orclient;

  return orclient;
}

export const orclient = new Promise<ORClient>((resolve, reject) => {
  create().then(orcl => {
    resolve(orcl);
  }).catch(reason => {
    const errStr = `Error creating orclient: ${stringify(reason)}`;
    console.error(errStr);
    reject(new Error(errStr))
  });
})

