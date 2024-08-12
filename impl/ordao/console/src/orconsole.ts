import { ORClient, defaultConfig, Config } from "orclient/index.js";
import { ORContext as ORContextOrig, ConfigWithOrnode } from "ortypes/orContext.js";
import { stringify } from "ts-utils";

// Re-define so that ORContext docs are included
export class ORContext extends ORContextOrig<ConfigWithOrnode> {}

function _getPublicFunctions(): string[] {
  return Object.getOwnPropertyNames(ORClient.prototype)
    .filter(m => m[0] != '_');
}

const _methods = _getPublicFunctions();

const _docPath = "/classes/ORConsole.html";

// TODO: add intro to documentation and about how to use the console.
export class ORConsole extends ORClient {

  constructor(context: ORContext, cfg: Config = defaultConfig) {
    super(context, cfg);

    console.log("methods: ", stringify(_methods));
  }

  // Re-defining so that ORContext docs are included
  get context(): ORContext {
    return super.context;
  }
}

function _init() {
  for (const fname of _methods) {
    const prop = (ORClient.prototype as any)[fname];
    if (prop !== undefined) {
      prop['help'] = () => {
        window.location.hash = fname;
        window.location.pathname = _docPath;
      }
    }
  }

  (ORClient.prototype as any)['help'] = () => {
    console.log("Available methods: ", _methods);
    console.log("Use c.<method>.help() to get further help on any of the methods.")
    console.log("Example: c.proposeRespectTo.help()")
    console.log("         c.vote.help()")
  }
}

_init();
