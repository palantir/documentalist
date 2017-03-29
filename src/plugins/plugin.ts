/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { IBlock } from "../client";

/**
 * Abstract representation of a file, containing absolute path and synchronous `read` operation.
 */
export interface IFile {
    path: string;
    read(): string;
}

/**
 * Each plugin receives a `Compiler` instance to aid in the processing of source files.
 */
export interface ICompiler {
    /**
     * Converts an array of entries into a map of key to entry, using given
     * callback to extract key from each item.
     */
    objectify<T>(array: T[], getKey: (item: T) => string): { [key: string]: T };

    /**
     * Render a block of content by extracting metadata (YAML front matter) and
     * splitting text content into markdown-rendered HTML strings and `{ tag,
     * value }` objects.
     *
     * To prevent special strings like "@include" from being parsed, a reserved
     * tag words array may be provided, in which case the line will be left as
     * is.
     */
    renderBlock(blockContent: string, reservedTagWords?: string[]): IBlock;

    /**
     * Render a string of markdown to HTML, using the options from `Documentalist`.
     */
    renderMarkdown(markdown: string): string;
}

export interface IPlugin<T> {
    compile(files: IFile[], doc: ICompiler): T | Promise<T>;
}
