#!/bin/bash

npx tsc --watch &
sleep 5
npx nodemon dist/index.js

# https://stackoverflow.com/questions/360201/how-do-i-kill-background-processes-jobs-when-my-shell-script-exits
trap 'kill $(jobs -p)' SIGINT SIGTERM EXIT

