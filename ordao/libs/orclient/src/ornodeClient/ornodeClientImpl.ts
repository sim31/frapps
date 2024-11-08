import { stringify } from "@sim31/ts-utils";
import { Implementation } from "./ornodeClient.js"
import { jsonEndpoints } from "./ornodeClient.js"

export function createImplementation(ornodeUrl: string): Implementation {
  return async (method, path, params) => {
    const hasBody = !["get", "delete"].includes(method);
    const searchParams = hasBody ? "" : `?${new URLSearchParams(params)}`;
    const response = await fetch(
      `${ornodeUrl}${path}${searchParams}`,
      {
        method: method.toUpperCase(),
        headers: hasBody ? { "Content-Type": "application/json" } : undefined, body: hasBody ? stringify(params) : undefined
      }
    );
    if (`${method} ${path}` in jsonEndpoints) {
      return response.json();
    }
    return response.text();
  };

}