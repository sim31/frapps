import { ExpressZodAPIClient as OrnodeClient } from "./ornodeClient.js";
import { createImplementation } from "./ornodeClientImpl.js";
export { OrnodeClient };

export function createOrnodeClient(url: string): OrnodeClient {
  return new OrnodeClient(createImplementation(url));
}