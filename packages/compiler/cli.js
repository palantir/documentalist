#!/usr/bin/env node
// @ts-check

/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Example Usage
// documentalist "./src/**/*"

const yargs = require("yargs");
const fs = require("fs");
const glob = require("glob");
const { Documentalist, KssPlugin, MarkdownPlugin, NpmPlugin, TypescriptPlugin } = require("./lib/");

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
