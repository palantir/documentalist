import * as glob from "glob";
import * as yaml from "js-yaml";
import * as Remarkable from "remarkable";

import { StringOrTag } from "./client";
import { CssPlugin } from "./plugins/css";
import { MarkdownPlugin } from "./plugins/markdown";
import { IPlugin } from "./plugins/plugin";
import { TypescriptPlugin } from "./plugins/typescript";

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

export interface IOptions {
    // TODO: expose all Remarkable options?

    /** Expose syntax highlighting so user can choose highlighter and languages. */
    highlight: (source: string, language: string) => string;
}

export interface IBlock {
    content: string;
    metadata: any;
    renderedContent: StringOrTag[];
}

export class Documentalist {
    public markdown: Remarkable;
    private options: IOptions;
    private plugins: Array<{ pattern: RegExp, plugin: IPlugin }> = [];

    constructor(options: Partial<IOptions> = {}) {
        this.options = {
            contents: "html",
            headingAnchorClassName: "docs-anchor",
            highlight: (source) => source,
            ...options,
        };

        this.markdown = new Remarkable({
            highlight: this.options.highlight,
            html: true,
            langPrefix: "",
        });

        this.use(/\.md$/, new MarkdownPlugin());
        this.use(/\.s?css$/, new CssPlugin());
        this.use(/\.tsx?$/, new TypescriptPlugin());
    }

    public use(pattern: RegExp, plugin: IPlugin) {
        this.plugins.push({ pattern, plugin });
        return this;
    }

    public traverse(...filesGlobs: string[]) {
        const documentation: any = {};
        const files = filesGlobs
            .map((filesGlob) => glob.sync(filesGlob))
            .reduce((a, b) => a.concat(b));
        for (const { pattern, plugin } of this.plugins) {
            documentation[plugin.name] = plugin.compile(this, files.filter((f) => pattern.test(f)));
        }
        return documentation;
    }

    public renderBlock(blockContent: string, reservedTagWords = RESERVED_WORDS): IBlock {
        const { content, metadata } = this.extractMetadata(blockContent);
        const renderedContent = this.renderContents(content, reservedTagWords);
        return { content, metadata, renderedContent };
    }

    /**
     * Converts the content string into an array of `ContentNode`s. If the
     * `contents` option is `html`, the string nodes will also be rendered with
     * markdown.
     */
    private renderContents(content: string, reservedTagWords: string[]) {
        const splitContents = this.parseTags(content, reservedTagWords);
        return splitContents
            .map((node) => typeof node === "string" ? this.markdown.render(node) : node)
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
            } else {
                return {
                    tag: match[1],
                    value: match[2],
                };
            }
        });
    }
}
