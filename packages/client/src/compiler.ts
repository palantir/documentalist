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

import { StringOrTag } from "./tags";

/**
 * Each plugin receives a `Compiler` instance to aid in the processing of source files.
 */
export interface Compiler {
    /**
     * Converts an array of entries into a map of key to entry, using given
     * callback to extract key from each item.
     */
    objectify<T>(array: T[], getKey: (item: T) => string): { [key: string]: T };

    /**
     * Get the relative path from `sourceBaseDir` to the given path.
     */
    relativePath(path: string): string;

    /**
     * Render a block of content by extracting metadata (YAML front matter) and
     * splitting text content into markdown-rendered HTML strings and `{ tag,
     * value }` objects.
     *
     * To prevent special strings like "@include" from being parsed, a reserved
     * tag words array may be provided, in which case the line will be left as
     * is.
     */
    renderBlock(blockContent: string, reservedTagWords?: string[]): Promise<Block>;

    /**
     * Render a string of markdown to HTML, using the options from `Documentalist`.
     * If any `marked` plugin is set to `async: true`, the return value will be a Promise.
     */
    renderMarkdown(markdown: string): string | Promise<string>;
}

/**
 * Metadata is parsed from YAML front matter in files and can contain arbitrary data.
 * A few keys are understood by Documentalist and, if defined in front matter,
 * will override default behavior.
 *
 * ```md
 * ---
 * reference: overview
 * title: "Welcome to the Jungle"
 * ---
 * actual contents of file...
 * ```
 */
export interface Metadata {
    /**
     * Unique ID for addressing this page.
     * @default filename without extension
     */
    reference?: string;

    /**
     * Human-friendly title of this page, for display in the UI.
     * @default value of first `@#` tag
     */
    title?: string;

    // Supports arbitrary string keys.
    [key: string]: any;
}

/**
 * The output of `renderBlock` which parses a long form documentation block into
 * metadata, rendered markdown, and tags.
 */
export interface Block {
    /** Parsed nodes of source file. An array of markdown-rendered HTML strings or `@tag` objects. */
    contents: StringOrTag[];

    /** Raw unmodified contents of source file (excluding the metadata). */
    contentsRaw: string;

    /** Arbitrary YAML metadata parsed from front matter of source file, if any, or `{}`. */
    metadata: Metadata;
}
