#!/usr/bin/env node

// Example Usage
// ./cli.js --ts 'test/fixtures/**/*.{ts,tsx}' --md 'test/fixtures/**/*.md' --css 'test/fixtures/**/*.css'

const program = require("commander");
const fs = require("fs");
const glob = require("glob");
const { Documentalist } = require("./dist/");

program
    .description("Generate documentation JSON")
    .option("--ts, --typescript [glob]", "A glob of typescript files")
    .option("--md, --markdown [glob]", "A glob of markdown files")
    .option("--css [glob]", "A glob of CSS files")
    .parse(process.argv);

let addedFiles = false;
const documentation = {};
const doc = new Documentalist();

function usePlugin(plugin, files) {
    documentation[plugin.name] = plugin.compile(doc, glob.sync(files));
}

if (program.typescript) {
    addedFiles = true;
    const { TypescriptPlugin } = require("./dist/plugins/typescript");
    usePlugin(new TypescriptPlugin(), program.typescript);
}

if (program.css) {
    addedFiles = true;
    const { CssPlugin } = require("./dist/plugins/css");
    usePlugin(new CssPlugin(), program.css);
}

if (program.markdown) {
    addedFiles = true;
    const { MarkdownPlugin } = require("./dist/plugins/markdown");
    usePlugin(new MarkdownPlugin(), program.markdown);
}

if (addedFiles) {
    console.log(JSON.stringify(documentation, null, 2));
} else {
    console.log("  ERROR: Must include some files");
    program.help();
}
