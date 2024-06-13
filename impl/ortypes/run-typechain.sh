#!/bin/bash

npx typechain --target=ethers-v6 --out-dir typechain-types/orec/ './node_modules/orec/artifacts/!(build-info)/**/+([a-zA-Z0-9_]).json' --show-stack-traces
