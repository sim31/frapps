import { Deployment, DevConfig, defaultDevConfig } from "./deployment.js";

const cfg: DevConfig = {
  ...defaultDevConfig,
  votePeriod: BigInt(process.env.VOTE_PERIOD ?? 120n),
  vetoPeriod: BigInt(process.env.VETO_PERIOD ?? 120n)
}

async function run() {
  const d = await Deployment.devDeploy(cfg);
  d.serialize("./tmp/dev-deployment.json");
}

run();