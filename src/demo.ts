import { writeFileSync } from "fs";
import * as glob from "glob";
import * as Highlights from "highlights";
import Documentalist from "./";

// user is responsible for syntax highlighting.
// so they can configure it however they need, so long as it's synchronous.
const highlighter = new Highlights();
function highlight(fileContents: string, language: string) {
    let scopeName = language;
    // massage markdown language hint into TM language scope
    if (language === "html") {
        scopeName = "text.html.basic";
    } else if (language != null && !/^source\./.test(language)) {
        scopeName = `source.${language}`;
    }
    // highlights returns HTML already wrapped in a <pre> tag
    return highlighter.highlightSync({ fileContents, scopeName });
}

const doc = new Documentalist({ highlight });

// user is responsible for globbing (makes for easy CLI usage too)
const BLUEPRINT_DIR = "../blueprint-public/packages/core/src";
console.log(
    doc.add(...glob.sync(`${BLUEPRINT_DIR}/**/*.md`)),
);

writeFileSync("dist/data.json", JSON.stringify({
    layout: doc.tree(BLUEPRINT_DIR),
    pages: doc.read(),
}, null, 2));
