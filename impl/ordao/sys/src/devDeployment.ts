import { Deployment } from "./deployment.js";

async function run() {
  const d = await Deployment.devDeploy();
  d.serialize("./tmp/dev-deployment.json");
}

run();