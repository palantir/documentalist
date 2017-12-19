import * as yaml from "js-yaml";
import * as marked from "marked";
import { IBlock, IHeadingTag, StringOrTag} from "./client";
import { ICompiler } from "./plugins";

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

export interface ICompilerOptions {
    /** Options for markdown rendering. See https://github.com/chjj/marked#options-1. */
    markdown?: marked.MarkedOptions;

    /**
     * Reserved @tags that should be preserved in the contents string.
     * A common use case is allowing specific code constructs, like `@Decorator` names.
     * Do not include the `@` prefix in the strings.
     */
    reservedTags?: string[];
}

export class Compiler implements ICompiler {
    public constructor(private options: ICompilerOptions) {
    }

    public objectify<T>(array: T[], getKey: (item: T) => string) {
        return array.reduce<{ [key: string]: T }>((obj, item) => {
            obj[getKey(item)] = item;
            return obj;
        }, {});
    }

    public renderBlock = (blockContent: string, reservedTagWords = this.options.reservedTags): IBlock => {
        const { contentsRaw, metadata } = this.extractMetadata(blockContent);
        const contents = this.renderContents(contentsRaw, reservedTagWords);
        return { contents, contentsRaw, metadata };
    }

    public renderMarkdown = (markdown: string) => marked(markdown, this.options.markdown);

    /**
     * Converts the content string into an array of `ContentNode`s. If the
     * `contents` option is `html`, the string nodes will also be rendered with
     * markdown.
     */
    private renderContents(content: string, reservedTagWords?: string[]) {
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
            return { contentsRaw: text, metadata: {} };
        }

        const contentsRaw = text.substr(match[0].length);
        return { contentsRaw, metadata: yaml.load(match[1]) || {} };
    }

    /**
     * Splits the content string when it encounters a line that begins with a
     * `@tag`. You may prevent this splitting by specifying an array of reserved
     * tag names.
     */
    private parseTags(content: string, reservedWords: string[] = []) {
        // using reduce so we can squash consecutive strings (<= 1 entry per iteration)
        return content.split(TAG_SPLIT_REGEX).reduce((arr, str) => {
            const match = TAG_REGEX.exec(str);
            if (match === null || reservedWords.indexOf(match[1]) >= 0) {
                if (typeof arr[arr.length - 1] === "string") {
                    // merge consecutive strings to avoid breaking up code blocks
                    arr[arr.length - 1] += str;
                } else {
                    arr.push(str);
                }
            } else {
                const tag = match[1];
                const value = match[2];
                if (/#+/.test(tag)) {
                    // NOTE: not enough information to populate `route` field yet
                    const heading: IHeadingTag = { tag: "heading", value, level: tag.length, route: "" };
                    arr.push(heading);
                } else {
                    arr.push({ tag, value });
                }
            }
            return arr;
        }, [] as StringOrTag[]);
    }
}
