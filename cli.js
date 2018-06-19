#!/usr/bin/env node
// @ts-check

// Example Usage
// ./cli.js "./src/**/*"
/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

const yargs = require("yargs");
const fs = require("fs");
const glob = require("glob");
const { Documentalist, KssPlugin, MarkdownPlugin, NpmPlugin, TypescriptPlugin } = require("./dist/");

const argv = yargs
    .alias("v", "version")
    // @ts-ignore
    .version(require("./package.json").version)
    .usage("$0 [options] <files>")
    .option("md", {
        default: true,
        desc: "use MarkdownPlugin for .md files",
        type: "boolean",
    })
    .option("npm", {
        default: true,
        desc: "use NPM plugin for package.json files",
        type: "boolean",
    })
    .option("ts", {
        default: true,
        desc: "use TypescriptPlugin for .tsx? files",
        type: "boolean",
    })
    .option("css", {
        desc: "use KssPlugin for .(css|less|scss) files",
        type: "boolean",
    })
    .demandCommand(1, "Requires at least one file")
    .argv;

let docs = Documentalist.create();

if (argv.md) {
    docs = docs.use(".md", new MarkdownPlugin());
}
if (argv.npm) {
    docs = docs.use("package.json", new NpmPlugin());
}
if (argv.ts) {
    docs = docs.use(/\.tsx?$/, new TypescriptPlugin({ excludePaths: ["__tests__/"] }));
}
if (argv.css) {
    docs = docs.use(/\.(css|less|s[ac]ss)$/, new KssPlugin());
}

docs.documentGlobs(...argv._)
    .then((data) => JSON.stringify(data, null, 2))
    .then(console.log, console.error);
