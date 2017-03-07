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
import { IDocumentalistData, StringOrTag } from "./client";
import { IFile, IPlugin, MarkdownPlugin, TypescriptPlugin } from "./plugins";

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

export interface IBlock {
    content: string;
    metadata: any;
    renderedContent: StringOrTag[];
}

export interface IApi {
    /** Process the given globs and emit all the data. */
    documentGlobs: (...filesGlobs: string[]) => IDocumentalistData;

    /** Process the given list of files and emit all the data. */
    documentFiles: (files: IFile[]) => IDocumentalistData;

    /**
     * Render a block of content by extracting metadata front matter and
     * splitting text content into rendered HTML strings and `{ tag, value }` objects.
     */
    renderBlock: (blockContent: string, reservedTagWords?: string[]) => IBlock;

    /** Use a plugin to process the files matching the pattern. */
    use: (pattern: RegExp, plugin: IPlugin<any>) => IApi;
}

export interface IOptions {
    markedOptions?: MarkedOptions;
}

export class Documentalist implements IApi {
    private plugins: Array<{ pattern: RegExp, plugin: IPlugin<any> }> = [];

    constructor(private markedOptions: MarkedOptions = {}) {
        this.use(/\.md$/, new MarkdownPlugin())
            .use(/\.tsx?$/, new TypescriptPlugin());
    }

    public clearPlugins() {
        this.plugins = [];
        return this;
    }

    public use(pattern: RegExp, plugin: IPlugin<any>) {
        this.plugins.push({ pattern, plugin });
        return this;
    }

    public documentGlobs(...filesGlobs: string[]) {
        const files = this.expandGlobs(filesGlobs);
        return this.documentFiles(files);
    }

    public documentFiles(files: IFile[]) {
        const documentation = {} as IDocumentalistData;
        for (const { pattern, plugin } of this.plugins) {
            documentation[plugin.name] = plugin.compile(this, files.filter((f) => pattern.test(f.path)));
        }
        return documentation;
    }

    public renderBlock(blockContent: string, reservedTagWords = RESERVED_WORDS): IBlock {
        const { content, metadata } = this.extractMetadata(blockContent);
        const renderedContent = this.renderContents(content, reservedTagWords);
        return { content, metadata, renderedContent };
    }

    /** Expand an array of globs and flatten to a single array of files. */
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
