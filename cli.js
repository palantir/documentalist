#!/usr/bin/env node

// Example Usage
// ./cli.js --ts 'test/fixtures/**/*.{ts,tsx}' --md 'test/fixtures/**/*.md' --css 'test/fixtures/**/*.css'
/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

const yargs = require("yargs");
const fs = require("fs");
const glob = require("glob");
const { Documentalist } = require("./dist/");

const argv = yargs
    .version(require("./package.json").version)
    .usage("$0 [options] <files>")
    .demandCommand(1, "Requires at least one file")
    // TODO: how to specify plugin on CLI?
    // .option("--use [pattern:plugin]", "Use a plugin to process files matching the pattern")
    .argv;

// ensure `use` option is always an array
const plugins = [].concat(argv.use)
    .filter((use) => use !== undefined)
    .map((/** @type {string} */ use) => {
        const [pattern, plugin] = use.split(":");
        if (plugin === undefined) {
            console.error("invalid --use option '%s'", use);
            process.exit(1);
        }
        return { pattern, plugin };
    });

const docs = Documentalist.create();
plugins.forEach(({ pattern, plugin }) => {
    docs.use(new RegExp(pattern), plugin);
});
docs.documentGlobs(...argv._)
    .then((data) => JSON.stringify(data, null, 2))
    .then(console.log, console.error);
