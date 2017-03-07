/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as fs from "fs";
import * as glob from "glob";
import * as yaml from "js-yaml";
import * as marked from "marked";
import * as path from "path";
import { StringOrTag } from "./client";
import {
    IFile,
    IMarkdownPluginData,
    IPlugin,
    ITypescriptPluginData,
    MarkdownPlugin,
    TypescriptPlugin,
} from "./plugins";

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

export interface IApi<T> {
    /**
     * Finds all files matching the provided variadic glob expressions and then
     * runs `documentFiles` with them, emitting all the documentation data.
     *
     * @see documentFiles
     */
    documentGlobs: (...filesGlobs: string[]) => T;

    /**
     * Iterates over all plugins, passing all matching files to each in turn.
     * The resulting output for each plugin is combined into the resulting
     * documentation object.
     *
     * The documentation object has a composite type of all the plugin data
     * types.
     */
    documentFiles: (files: IFile[]) => T;

    /**
     * Render a block of content by extracting metadata (YAML front matter) and
     * splitting text content into markdown-rendered HTML strings and `{ tag,
     * value }` objects.
     *
     * To prevent special strings like "@include" from being parsed, a reserved
     * tag words array may be provided, in which case the line will be left as
     * is.
     */
    renderBlock: (blockContent: string, reservedTagWords?: string[]) => IBlock;

    /**
     * Adds the plugin to Documentalist. Returns a new instance of Documentalist
     * with a template type that includes the data from the plugin. This way the
     * `documentFiles` and `documentGlobs` methods will return an object that is
     * already typed to include the plugin output.
     *
     * The Plugin is applied to all files whose absolute path matches the
     * supplied pattern.
     *
     * @param pattern - A regexp pattern or a file extension string like "js"
     * @param plugin - The plugin implementation
     * @returns A new instance of `Documentalist` with an extended type
     */
    use: <P>(pattern: RegExp | string, plugin: IPlugin<P>) => IApi<T & P>;

    /**
     * Returns a new instance of Documentalist with no plugins.
     */
    clearPlugins(): IApi<void>
}

/**
 * The output of `renderBlock` which parses a long form documentation block into
 * metadata, rendered markdown, and tags.
 */
export interface IBlock {
    /**
     * The original string content block
     */
    content: string;

    /**
     * Parsed YAML front matter (if any) or {}.
     */
    metadata: any;

    /**
     * An array of markdown-rendered HTML or tags.
     */
    renderedContent: StringOrTag[];
}

/**
 * Plugins are stored with the regex used to match against file paths.
 */
export interface IPluginEntry<T> {
    pattern: RegExp;
    plugin: IPlugin<T>;
}

export class Documentalist<T> implements IApi<T> {
    public static create(markedOptions?: MarkedOptions): IApi<IMarkdownPluginData & ITypescriptPluginData> {
        return new Documentalist([], markedOptions)
            .use(/\.md$/, new MarkdownPlugin())
            .use(/\.tsx?$/, new TypescriptPlugin());
    }

    constructor(
        private plugins: IPluginEntry<T>[] = [],
        private markedOptions: MarkedOptions = {}) {
    }

    public use<P>(pattern: RegExp | string, plugin: IPlugin<P>): IApi<T & P> {
        if (typeof pattern === "string") {
            pattern = new RegExp(`\\.${pattern}$`);
        }

        const newPlugins = this.plugins.slice();
        newPlugins.push({ pattern, plugin } as IPluginEntry<T & P>);
        return new Documentalist(newPlugins as IPluginEntry<T & P>[], this.markedOptions);
    }

    public clearPlugins(): IApi<void> {
        return new Documentalist<void>([], this.markedOptions);
    }

    public documentGlobs(...filesGlobs: string[]) {
        const files = this.expandGlobs(filesGlobs);
        return this.documentFiles(files);
    }

    public documentFiles(files: IFile[]) {
        const documentation = {} as T;
        for (const { pattern, plugin } of this.plugins) {
            const pluginDocumentation = plugin.compile(this, files.filter((f) => pattern.test(f.path)));
            for (var key in pluginDocumentation) {
                if (pluginDocumentation.hasOwnProperty(key)) {
                    if (documentation.hasOwnProperty(key)) {
                        console.warn(`
                            WARNING: Duplicate plugin key "${key}".
                            Your plugins are overwriting each other.
                        `);
                    }
                    documentation[key] = pluginDocumentation[key];
                }
            }
        }
        return documentation;
    }

    public renderBlock(blockContent: string, reservedTagWords = RESERVED_WORDS): IBlock {
        const { content, metadata } = this.extractMetadata(blockContent);
        const renderedContent = this.renderContents(content, reservedTagWords);
        return { content, metadata, renderedContent };
    }

    /**
     * Expands an array of globs and flatten to a single array of files.
     */
    private expandGlobs(filesGlobs: string[]) {
        return filesGlobs
            .map((filesGlob) => glob.sync(filesGlob))
            .reduce((a, b) => a.concat(b))
            .map((fileName) => {
                const absolutePath = path.resolve(fileName);
                return {
                    path: absolutePath,
                    read: () => fs.readFileSync(absolutePath, "utf8"),
                };
            });
    }

    /**
     * Converts the content string into an array of `ContentNode`s. If the
     * `contents` option is `html`, the string nodes will also be rendered with
     * markdown.
     */
    private renderContents(content: string, reservedTagWords: string[]) {
        const splitContents = this.parseTags(content, reservedTagWords);
        return splitContents
            .map((node) => typeof node === "string" ? marked(node, this.markedOptions) : node)
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
