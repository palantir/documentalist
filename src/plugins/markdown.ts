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
     * @default "_nav"
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
        const pageStore = this.buildPageStore(markdownFiles, compiler);
        // generate navigation tree after all pages loaded and processed.
        const nav = pageStore.toTree(this.options.navPage).children as IPageNode[];
        const pages = pageStore.toObject();
        return { nav, pages };
    }

    private blockToPage(filePath: string, block: IBlock): IPageData {
        const reference = getReference(filePath, block);
        return {
            reference,
            route: reference,
            title: getTitle(block),
            ...block,
        };
    }

    /** Convert each file to IPageData and populate store. */
    private buildPageStore(markdownFiles: IFile[], { renderBlock }: ICompiler) {
        const pageStore = new PageMap();
        for (const file of markdownFiles) {
            const block = renderBlock(file.read());
            const page = this.blockToPage(file.path, block);
            pageStore.set(page.reference, page);
        }
        return pageStore;
    }

    private buildPageObject(pages: PageMap, nav: IPageNode[]) {
        function recurseRoute(node: IPageNode | IHeadingNode, parent: IPageNode) {
            const route = isPageNode(node)
                ? [parent.route, node.reference].join("/")
                : [parent.route, slugify(node.title)].join(".");
            node.route = route;

            if (isPageNode(node)) {
                // node is a page, so it must exist in PageMap.
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
    }
}

function getReference(absolutePath: string, { metadata }: IBlock) {
    if (metadata.reference != null) {
        return metadata.reference;
    }
    return path.basename(absolutePath, path.extname(absolutePath));
}

function getTitle(block: IBlock) {
    if (block.metadata.title !== undefined) {
        return block.metadata.title;
    }

    const first = block.contents[0];
    if (isHeadingTag(first)) {
        return first.value;
    }

    return "(untitled)";
}
