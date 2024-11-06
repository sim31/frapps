#!/bin/bash

npx tsc --watch &
sleep 5
npx nodemon --watch node_modules/ortypes node_modules/ts-utils dist/index.js 

# TODO: run hardhat node as well...

# https://stackoverflow.com/questions/360201/how-do-i-kill-background-processes-jobs-when-my-shell-script-exits
trap 'kill $(jobs -p)' SIGINT SIGTERM EXIT

