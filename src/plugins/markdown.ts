/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { IHeadingNode, IPageData, IPageNode, isHeadingTag, isPageNode, slugify, StringOrTag } from "../client";
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
}

export class MarkdownPlugin implements IPlugin<IMarkdownPluginData> {
    private options: IMarkdownPluginOptions;

    public constructor(options: Partial<IMarkdownPluginOptions> = {}) {
        this.options = {
            navPage: "_nav",
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
        this.buildPageObject(pageStore, nav);
        const pages = pageStore.toObject();
        return { nav, pages };
    }

    private buildNavTree(pages: PageMap) {
        return pages.toTree(this.options.navPage).children as IPageNode[];
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

    private buildPageObject(pages: PageMap, nav: IPageNode[]) {
        function recurseRoute(node: IPageNode | IHeadingNode, parent: IPageNode) {
            const route = isPageNode(node)
                ? [parent.route, node.reference].join("/")
                : [parent.route, slugify(node.title)].join(".");
            node.route = route;

            if (isPageNode(node)) {
                const page = pages.get(node.reference)!;
                page.route = route;

                page.contents.forEach((content) => {
                    // inject `route` field into heading tags
                    if (isHeadingTag(content)) {
                        if (content.level > 1) {
                            content.route = [route, slugify(content.value)].join(".");
                        } else {
                            content.route = route;
                        }
                    }
                });
                node.children.forEach((child) => recurseRoute(child, node));
            }
        }

        nav.forEach((page) => {
            page.children.forEach((node) => recurseRoute(node, page));
        });
    }
}
