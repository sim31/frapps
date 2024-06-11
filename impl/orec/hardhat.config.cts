import { HardhatUserConfig } from "hardhat/config.js";
import "@nomicfoundation/hardhat-toolbox";
import { join } from "path";
import { writeFile } from "fs/promises";
import { subtask } from "hardhat/config.js";
import { TASK_COMPILE_SOLIDITY } from "hardhat/builtin-tasks/task-names.js";

subtask(TASK_COMPILE_SOLIDITY).setAction(async (_, { config }, runSuper) => {
  const superRes = await runSuper();

  try {
    await writeFile(
      join(config.paths.root, "typechain-types", "package.json"),
      '{ "type": "commonjs" }'
    );
  } catch (error) {
    console.error("Error writing package.json: ", error);
  }

  return superRes;
});

const config: HardhatUserConfig = {
  solidity: "0.8.24"
};

export default config;
