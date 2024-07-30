import { ORClient, defaultConfig, Config } from "orclient/index.js";
import { ORContext, ConfigWithOrnode } from "ortypes/orContext.js";

export class ORConsole extends ORClient {
  constructor(context: ORContext<ConfigWithOrnode>, cfg: Config = defaultConfig) {
    super(context, cfg);
  }

}