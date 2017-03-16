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
                const absolutePath = file.path;
                const fileContents = file.read();
                const { content, metadata, renderedContent } = renderBlock(fileContents);
                return pageStore.add({
                    absolutePath,
                    contentRaw: content,
                    contents: renderedContent,
                    metadata,
                });
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
        const pages = pageStore.toObject();
        return { pages };
    }
}
