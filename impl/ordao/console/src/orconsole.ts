import { ORClient, defaultConfig, Config } from "orclient/index.js";
import { ORContext, ConfigWithOrnode } from "ortypes/orContext.js";
import { stringify } from "ts-utils";

export class ORConsole extends ORClient {
  private _methods: string[];
  private _docPath = "/classes/ORConsole.html";

  constructor(context: ORContext<ConfigWithOrnode>, cfg: Config = defaultConfig) {
    super(context, cfg);

    this._methods = Object.getOwnPropertyNames(ORClient.prototype)
      .filter(m => m[0] != '_');
    console.log("methods: ", stringify(this._methods));
  }

  help(method?: string) {
    const methodMatch = method === undefined
      ? undefined
      : this._methods.find(m => m === method);

    if (methodMatch === undefined) {
      console.log(this._methods);
    } else {
      window.location.hash = methodMatch;
      if (window.location.pathname !== this._docPath) {
        window.location.pathname = this._docPath;
      }
    }
  }

}