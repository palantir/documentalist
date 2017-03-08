/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { IPageData, StringOrTag } from "../client";
import { ICompiler } from "../compiler";
import { makePage } from "../page";
import { IFile, IPlugin } from "./plugin";

export interface IMarkdownPluginData {
    docs: {
        [key: string]: IPageData;
    };
}

export class MarkdownPlugin implements IPlugin<IMarkdownPluginData> {
    /**
     * Reads the given set of markdown files and adds their data to the internal storage.
     * Returns a plain object mapping page references to their data.
     */
    public compile(markdownFiles: IFile[], { renderBlock }: ICompiler) {
        const pageStore: Map<string, IPageData> = new Map();
        markdownFiles
            .map((file) => {
                const absolutePath = file.path;
                const fileContents = file.read();
                const { content, metadata, renderedContent } = renderBlock(fileContents);
                const page = makePage({
                    absolutePath,
                    contentRaw: content,
                    contents: renderedContent,
                    metadata,
                });
                const ref = page.reference;
                if (pageStore.has(ref)) {
                    console.warn(`Found duplicate reference "${ref}"; overwriting previous data.`);
                    console.warn("Rename headings or use metadata `reference` key to disambiguate.");
                }
                pageStore.set(ref, page);
                return page;
            })
            .map((page) => {
                if (page.contents) {
                    const newContent = page.contents.reduce((array, content) => {
                        if (typeof content === "string" || content.tag !== "include") {
                            return array.concat(content);
                        }
                        const pageToInclude = pageStore.get(content.value as string);
                        if (pageToInclude === undefined) {
                            throw new Error(`Unknown @include reference '${content.value}' in '${page.reference}'`);
                        }
                        return array.concat(pageToInclude.contents!);
                    }, [] as StringOrTag[]);
                    page.contents = newContent;
                }
                return page;
            });
        const docs = mapToObject(pageStore);
        return { docs };
    }
}

function mapToObject<T>(map: Map<string, T>): { [key: string]: T } {
    const object: { [key: string]: T } = {};
    for (const [key, val] of map.entries()) {
        object[key] = val;
    }
    return object;
}
