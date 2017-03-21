import * as yaml from "js-yaml";
import * as marked from "marked";

import { IHeadingTag } from "./client";
import { IBlock, ICompiler, StringOrTag } from "./plugins/plugin";

/**
 * Matches the triple-dash metadata block on the first line of markdown file.
 * The first capture group contains YAML content.
 */
const METADATA_REGEX = /^---\n?((?:.|\n)*)\n---\n/;

/**
 * Splits text content for lines that begin with `@tagName`.
 */
const TAG_REGEX = /^@(\S+)(?:\s+([^\n]+))?$/;
const TAG_SPLIT_REGEX = /^(@\S+(?:\s+[^\n]+)?)$/gm;

/**
 * Ignored `@tag` names. Some languages already support `@tags`, so to separate
 * Documentalist tags, we use these default reserved words to avoid conflicts.
 *
 * Plugins may define their own reserved words when calling the `renderBlock`
 * method.
 */
const RESERVED_WORDS = [
    "import",
];

export class Compiler implements ICompiler {
    public constructor(private markedOptions: MarkedOptions) {
    }

    public objectify<T>(array: T[], getKey: (item: T) => string) {
        return array.reduce((obj, item) => {
            obj[getKey(item)] = item;
            return obj;
        }, {} as { [key: string]: T });
    }

    public renderBlock = (blockContent: string, reservedTagWords = RESERVED_WORDS): IBlock => {
        const { content, metadata } = this.extractMetadata(blockContent);
        const renderedContent = this.renderContents(content, reservedTagWords);
        return { content, metadata, renderedContent };
    }

    public renderMarkdown = (markdown: string) => marked(markdown, this.markedOptions);

    /**
     * Converts the content string into an array of `ContentNode`s. If the
     * `contents` option is `html`, the string nodes will also be rendered with
     * markdown.
     */
    private renderContents(content: string, reservedTagWords: string[]) {
        const splitContents = this.parseTags(content, reservedTagWords);
        return splitContents
            .map((node) => typeof node === "string" ? this.renderMarkdown(node) : node)
            .filter((node) => node !== "");
    }

    /**
     * Extracts optional YAML frontmatter metadata block from the beginning of a
     * markdown file and parses it to a JS object.
     */
    private extractMetadata(text: string) {
        const match = METADATA_REGEX.exec(text);
        if (match === null) {
            return { content: text, metadata: {} };
        }

        const content = text.substr(match[0].length);
        return { content, metadata: yaml.load(match[1]) || {} };
    }

    /**
     * Splits the content string when it encounters a line that begins with a
     * `@tag`. You may prevent this splitting by specifying an array of reserved
     * tag names.
     */
    private parseTags(content: string, reservedWords: string[]) {
        return content.split(TAG_SPLIT_REGEX).map((str): StringOrTag => {
            const match = TAG_REGEX.exec(str);
            if (match === null || reservedWords.indexOf(match[1]) >= 0) {
                return str;
            }
            const tag = match[1];
            const value = match[2];
            if (/#+/.test(tag)) {
                // NOTE: not enough information to populate `route` field yet
                return { tag: "heading", value, level: tag.length } as IHeadingTag;
            } else {
                return { tag, value };
            }
        });
    }
}
