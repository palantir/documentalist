/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import {
    IBlock,
    ICompiler,
    IFile,
    IHeadingNode,
    IMarkdownPluginData,
    IPageData,
    IPageNode,
    IPlugin,
    isHeadingTag,
    isPageNode,
    slugify,
} from "@documentalist/client";
import * as path from "path";
import { PageMap } from "../page";

export interface IMarkdownPluginOptions {
    /**
     * Page reference that lists the nav roots.
     * @default "_nav"
     */
    navPage: string;
}

/**
 * The `MarkdownPlugin` parses and renders markdown pages and produces a navigation tree of all documents.
 * This plugin traces `@page` and `@#+` "heading" tags to discover pages (given a single starting `navPage`)
 * and build up a tree representation of those pages.
 *
 * @see IPageData (rendered markdown page)
 * @see IPageNode (node in navigation tree)
 */
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
    public compile(markdownFiles: IFile[], compiler: ICompiler): IMarkdownPluginData {
        const pageMap = this.buildPageStore(markdownFiles, compiler);
        // now that we have all known pages, we can resolve @include tags.
        this.resolveIncludeTags(pageMap);
        // generate navigation tree after all pages loaded and processed.
        const { navPage } = this.options;
        if (pageMap.get(navPage) == null) {
            throw new Error(`Error generating page map: options.navPage "${navPage}" does not exist.`);
        }
        const nav = pageMap.toTree(navPage).children.filter(isPageNode);
        // use nav tree to fill in `route` for all pages and headings.
        this.resolveRoutes(pageMap, nav);
        // generate object at the end, after `route` has been computed throughout.
        const pages = pageMap.toObject();
        return { nav, pages };
    }

    private blockToPage(sourcePath: string, block: IBlock): IPageData {
        const reference = getReference(sourcePath, block);
        return {
            reference,
            route: reference,
            sourcePath,
            title: getTitle(block),
            ...block,
        };
    }

    /** Convert each file to IPageData and populate store. */
    private buildPageStore(markdownFiles: IFile[], { relativePath, renderBlock }: ICompiler) {
        const pageMap = new PageMap();
        for (const file of markdownFiles) {
            const block = renderBlock(file.read());
            const page = this.blockToPage(relativePath(file.path), block);
            pageMap.set(page.reference, page);
        }
        return pageMap;
    }

    /**
     * Computes `route` for the given `node` based on its parent.
     * If node is a page, then it also computes `route` for each heading and recurses through child
     * pages.
     */
    private recurseRoute(pageMap: PageMap, node: IPageNode | IHeadingNode, parent?: IPageNode) {
        // compute route for page and heading NODES (from nav tree)
        const baseRoute = parent === undefined ? [] : [parent.route];
        const route = isPageNode(node)
            ? baseRoute.concat(node.reference).join("/")
            : baseRoute.concat(slugify(node.title)).join(".");
        node.route = route;

        if (isPageNode(node)) {
            // node is a page, so it must exist in PageMap.
            const page = pageMap.get(node.reference)!;
            page.route = route;

            page.contents.forEach(content => {
                // inject `route` field into heading TAGS (from page contents)
                if (isHeadingTag(content)) {
                    // h1 tags do not get nested as they are used as page title
                    content.route = content.level > 1 ? [route, slugify(content.value)].join(".") : route;
                }
            });
            node.children.forEach(child => this.recurseRoute(pageMap, child, node));
        }
    }

    private resolveRoutes(pageMap: PageMap, nav: IPageNode[]) {
        for (const page of nav) {
            // walk the nav tree and compute `route` property for each resource.
            this.recurseRoute(pageMap, page);
        }
    }

    /** Iterates `contents` array and inlines any `@include page` tags. */
    private resolveIncludeTags(pageStore: PageMap) {
        for (const page of pageStore.pages()) {
            // using `reduce` so we can add one or many entries for each node
            page.contents = page.contents.reduce<typeof page.contents>((array, content) => {
                if (typeof content === "string" || content.tag !== "include") {
                    return array.concat(content);
                }
                // inline @include page
                const pageToInclude = pageStore.get(content.value);
                if (pageToInclude === undefined) {
                    throw new Error(`Unknown @include reference '${content.value}' in '${page.reference}'`);
                }
                return array.concat(pageToInclude.contents);
            }, []);
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
    if (block.metadata.title != null) {
        return block.metadata.title;
    }

    const first = block.contents[0];
    if (isHeadingTag(first)) {
        return first.value;
    }

    return "(untitled)";
}
