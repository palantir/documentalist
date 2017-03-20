/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { headingReference, IPageData, IPageNode, pageReference, StringOrTag } from "../client";
import { PageMap } from "../page";
import { ICompiler, IFile, IPlugin } from "./plugin";

export interface IMarkdownPluginData {
    /**
     * An ordered, nested, multi-rooted tree describing the navigation layout
     * of all the pages and their headings. Uses `@page` and `@#+` tags to build
     * this representation.
     */
    nav: IPageNode[];

    /** A map of page reference to data. */
    pages: {
        [reference: string]: IPageData;
    };
}

export interface IMarkdownPluginOptions {
    /**
     * Page reference that lists the nav roots.
     * @default
     */
    navPage: string;

    /**
     * Create a reference for a heading title within a page.
     * Default implementation slugifies heading and joins the references with `.`.
     */
    headingReference: (pageReference: string, headingTitle: string) => string;

    /**
     * Create a reference for a page nested within another page.
     * Default implementation joins the references with a `/`.
     */
    pageReference: (parentReference: string, pageReference: string) => string;
}

export class MarkdownPlugin implements IPlugin<IMarkdownPluginData> {
    private options: IMarkdownPluginOptions;

    public constructor(options: Partial<IMarkdownPluginOptions> = {}) {
        this.options = {
            navPage: "_nav",
            headingReference,
            pageReference,
            ...options,
        };
    }

    /**
     * Reads the given set of markdown files and adds their data to the internal storage.
     * Returns a plain object mapping page references to their data.
     */
    public compile(markdownFiles: IFile[], compiler: ICompiler) {
        const pageStore = this.buildPageMap(markdownFiles, compiler);
        // nav must be generated before pages because it rewrites references
        const nav = this.buildNavTree(pageStore);
        const pages = pageStore.toObject();
        return { nav, pages };
    }

    private buildPageMap(markdownFiles: IFile[], { renderBlock }: ICompiler) {
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
                    const pageToInclude = pageStore.get(content.value);
                    if (pageToInclude === undefined) {
                        throw new Error(`Unknown @include reference '${content.value}' in '${page.reference}'`);
                    }
                    return array.concat(pageToInclude.contents);
                }, [] as StringOrTag[]);
                return page;
            });
        return pageStore;
    }

    private buildNavTree(pages: PageMap) {
        return pages.toTree(this.options.navPage).children as IPageNode[];
    }
}
