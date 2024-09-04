import shelljs from "shelljs";

async function main() {
  shelljs.exec("ls ../../console/")
  shelljs.exec(`\
    npx nodemon \
    --watch ../../../ortypes/dist \
    --watch ../../../ts-utils/dist \
    --watch ../../../respect1155/sc/dist \
    --watch ../../../orec/dist/ \
    --watch ../../../orclient/dist/ \
    --watch ../../console/ \
    --ignore ../../console/build \
    --delay 5 \
    \
    src/runConsole.js \
    `
  );
}

main();