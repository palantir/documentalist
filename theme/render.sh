#!/usr/bin/env bash

cd "$(dirname "$0")"
mkdir -p ../docs
cp -rf ./assets ../docs/.
$(npm bin)/pug -O "$(../cli.js '../src/**/*')" ./index.pug --pretty -o ../docs
