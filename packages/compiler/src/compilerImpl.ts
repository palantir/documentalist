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

import { Block, Compiler, HeadingTag, StringOrTag } from "@documentalist/client";
import * as yaml from "js-yaml";
import { marked, MarkedOptions } from "marked";
import { relative } from "node:path";

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

export interface CompilerOptions {
    /** Options for markdown rendering. See https://github.com/chjj/marked#options-1. */
    markdown?: MarkedOptions;

    /**
     * Reserved @tags that should be preserved in the contents string.
     * A common use case is allowing specific code constructs, like `@Decorator` names.
     * Do not include the `@` prefix in the strings.
     */
    reservedTags?: string[];

    /**
     * Base directory for generating relative `sourcePath`s.
     *
     * This option _does not affect_ glob expansion, only the generation of
     * `sourcePath` in plugin data.
     * @default process.cwd()
     */
    sourceBaseDir?: string;
}

export class CompilerImpl implements Compiler {
    public constructor(private options: CompilerOptions) {}

    public objectify<T>(array: T[], getKey: (item: T) => string) {
        return array.reduce<{ [key: string]: T }>((obj, item) => {
            obj[getKey(item)] = item;
            return obj;
        }, {});
    }

    public relativePath = (path: string) => {
        const { sourceBaseDir = process.cwd() } = this.options;
        return relative(sourceBaseDir, path);
    };

    public renderBlock = async (blockContent: string, reservedTagWords = this.options.reservedTags): Promise<Block> => {
        const { contentsRaw, metadata } = this.extractMetadata(blockContent.trim());
        const contents = await this.renderContents(contentsRaw, reservedTagWords);
        return { contents, contentsRaw, metadata };
    };

    public renderMarkdown = (markdown: string) => marked(markdown, this.options.markdown);

    /**
     * Converts the content string into an array of `ContentNode`s. If the
     * `contents` option is `html`, the string nodes will also be rendered with
     * markdown.
     */
    private async renderContents(content: string, reservedTagWords?: string[]) {
        const splitContents = this.parseTags(content, reservedTagWords);
        const renderedContents = await Promise.all(
            splitContents.map(node => Promise.resolve(typeof node === "string" ? this.renderMarkdown(node) : node)),
        );
        return renderedContents.filter(node => node !== "");
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
        const yamlObject: any | undefined = yaml.load(match[1]);

        return { contentsRaw, metadata: yamlObject ?? {} };
    }

    /**
     * Splits the content string when it encounters a line that begins with a
     * `@tag`. You may prevent this splitting by specifying an array of reserved
     * tag names.
     */
    private parseTags(content: string, reservedWords: string[] = []) {
        // using reduce so we can squash consecutive strings (<= 1 entry per iteration)
        return content.split(TAG_SPLIT_REGEX).reduce<StringOrTag[]>((arr, str) => {
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
                    const heading: HeadingTag = {
                        level: tag.length,
                        route: "",
                        tag: "heading",
                        value,
                    };
                    arr.push(heading);
                } else {
                    arr.push({ tag, value });
                }
            }
            return arr;
        }, []);
    }
}
