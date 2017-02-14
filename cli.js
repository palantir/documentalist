#!/usr/bin/env node

// Example Usage
// ./cli.js --ts "test/fixtures/**/*.{ts,tsx}" --md "test/fixtures/**/*.md"

const program = require("commander");
const glob = require("glob");
const Documentalist = require("./dist/").default;

program
    .description("Generate documentation JSON")
    .option("--ts, --typescript [glob]", "A glob of typescript files")
    .option("--md, --markdown [glob]", "A glob of markdown files")
    .option("--css [glob]", "A glob of CSS files")
    .parse(process.argv);

let addedFiles = false
const documentation = {};
const doc = new Documentalist();

if (program.typescript) {
    addedFiles = true;
    const typescriptFiles = glob.sync(program.typescript);
    const tsdoc = require("ts-quick-docs");
    documentation.entities = tsdoc.fromFiles(typescriptFiles, {});
}

if (program.markdown) {
    addedFiles = true;
    const markdownFiles = glob.sync(program.markdown);
    doc.add(...markdownFiles);
    documentation.layout = doc.tree();
    documentation.pages = doc.read();
}

if (addedFiles) {
    console.log(JSON.stringify(documentation, null, 2));
} else {
    console.log("  ERROR: Must include some files");
    program.help();
}
