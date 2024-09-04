// import { ORClient } from "orclient";
// import { ORContext, ConfigWithOrnode } from "ortypes/orContext.js";
// import { config } from "./config.js"
import { ConfigWithOrnode } from "ortypes/orContext.js";
import { config } from "./config.js";
import { RemoteOrnode } from "orclient";
import { ORConsole } from "./orconsole.js";
import { BrowserProvider } from "ethers";
import { ORContext } from "ortypes/orContext.js";

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

async function create() {
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

  const orconsole = new ORConsole(ctx);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).c = orconsole;
}

// if (
//   window.location.pathname === "/" || 
//   window.location.pathname === ""
// ) {
//   const newUrl =
//     window.location.protocol + "//"
//     + window.location.host + "/index.html"
//     + window.location.search   
//   window.location.replace(newUrl);
// } else {
//   create();
// }

create();



