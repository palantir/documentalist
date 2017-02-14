import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import { ContentNode } from "./page";

/**
 * UTILITY FUNCTIONS
 */

// matches the triple-dash metadata block on the first line of markdown file.
// first capture group contains YAML content.
const METADATA_REGEX = /^---\n?((?:.|\n)*)\n---\n/;

/**
 * Extracts optional YAML metadata block from the beginning of a markdown file
 * and parses it to a JS object.
 */
export function extractMetadata(markdown: string) {
    const match = METADATA_REGEX.exec(markdown);
    if (match === null) {
        return { contents: markdown, metadata: {} };
    }
    const contents = markdown.substr(match[0].length);
    return { contents, metadata: yaml.load(match[1]) || {} };
}

export type NSObject = { [key: string]: NSObject };
export function namespaceify(namespaces: string[], root: NSObject = {}): NSObject {
    let head = root;
    while (namespaces.length > 0) {
        // we know it won't be undefined from while condition
        const ns = <string> namespaces.shift();
        if (head[ns] === undefined) {
            head[ns] = {};
        }
        head = head[ns];
    }
    return root;
}

export function readFile(path: string) {
    return readFileSync(path, "utf-8");
}

export function extractTags(contents: string, reservedWords: string[] = []) {
    const FLAG_REGEX = /^@(\w+)(?:\s([^$@]+))?$/;
    return contents.split(/^(@[a-zA-Z\d]+(?:\s+[^\n]+))$/gm).map((str): ContentNode => {
        const match = FLAG_REGEX.exec(str);
        if (match === null || reservedWords.indexOf(match[1]) >= 0) {
            return str;
        } else {
            return {
                tag: match[1],
                value: match[2] || true,
            };
        }
    });
}
