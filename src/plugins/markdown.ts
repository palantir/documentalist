/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as path from "path";
import { IBlock, IHeadingNode, IPageData, IPageNode, isHeadingTag, isPageNode, slugify, StringOrTag } from "../client";
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
        // now that we have all known pages, we can resolve @include tags.
        this.resolveIncludeTags(pageStore);
        // generate navigation tree after all pages loaded and processed.
        const nav = pageStore.toTree(this.options.navPage).children as IPageNode[];
        // use nav tree to fill in `route` for all pages and headings.
        this.resolveRoutes(pageStore, nav);
        // generate object at the end, after `route` has been computed throughout.
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

    /**
     * Computes `route` for the given `node` based on its parent.
     * If node is a page, then it also computes `route` for each heading and recurses through child
     * pages.
     */
    private recurseRoute(node: IPageNode | IHeadingNode, parent: IPageNode, pageStore: PageMap) {
        // compute route for page and heading NODES (from nav tree)
        const route = isPageNode(node)
            ? [parent.route, node.reference].join("/")
            : [parent.route, slugify(node.title)].join(".");
        node.route = route;

        if (isPageNode(node)) {
            // node is a page, so it must exist in PageMap.
            const page = pageStore.get(node.reference)!;
            page.route = route;

            page.contents.forEach((content) => {
                // inject `route` field into heading TAGS (from page contents)
                if (isHeadingTag(content)) {
                    // h1 tags do not get nested as they are used as page title
                    if (content.level > 1) {
                        content.route = [route, slugify(content.value)].join(".");
                    } else {
                        content.route = route;
                    }
                }
            });
            node.children.forEach((child) => this.recurseRoute(child, node, pageStore));
        }
    }

    private resolveRoutes(pageStore: PageMap, nav: IPageNode[]) {
        for (const page of nav) {
            // walk the nav tree and compute `route` property for each resource.
            page.children.forEach((node) => this.recurseRoute(node, page, pageStore));
        }
    }

    /** Iterates `contents` array and inlines any `@include page` tags. */
    private resolveIncludeTags(pageStore: PageMap) {
        for (const page of pageStore.pages()) {
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
