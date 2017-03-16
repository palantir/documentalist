/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { IPageData, StringOrTag } from "../client";
import { PageMap } from "../page";
import { ICompiler, IFile, IPlugin } from "./plugin";

export interface IMarkdownPluginData {
    pages: {
        [key: string]: IPageData;
    };
}

export class MarkdownPlugin implements IPlugin<IMarkdownPluginData> {
    /**
     * Reads the given set of markdown files and adds their data to the internal storage.
     * Returns a plain object mapping page references to their data.
     */
    public compile(markdownFiles: IFile[], { renderBlock }: ICompiler) {
        const pageStore: PageMap = new PageMap();
        markdownFiles
            .map((file) => {
                const { content, metadata, renderedContent } = renderBlock(file.read());
                return pageStore.add({
                    absolutePath: file.path,
                    contentRaw: content,
                    contents: renderedContent,
                    metadata,
                });
            })
            .map((page) => {
                // using `reduce` so we can add one or many entries for each node
                page.contents = page.contents.reduce((array, content) => {
                    if (typeof content === "string" || content.tag !== "include") {
                        return array.concat(content);
                    }
                    // inline @include page
                    try {
                        const pageToInclude = pageStore.remove(content.value);
                        return array.concat(pageToInclude.contents);
                    } catch (ex) {
                        throw new Error(`Unknown @include reference '${content.value}' in '${page.reference}'`);
                    }
                }, [] as StringOrTag[]);
                return page;
            });
        const pages = pageStore.toObject();
        return { pages };
    }
}
