/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { IHeadingNode, IPageData, IPageNode, isPageNode, isTag, slugify, StringOrTag } from "../client";
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
     * Separator used to join page and heading slugs.
     * @default "."
     */
    headingSeparator: string;
    /**
     * Page reference that lists the nav roots.
     * @default
     */
    navPage: string;
    /**
     * Separator used to join nested page slugs.
     * @default "/"
     */
    pageSeparator: string;
}

export class MarkdownPlugin implements IPlugin<IMarkdownPluginData> {
    private options: IMarkdownPluginOptions;

    public constructor(options: Partial<IMarkdownPluginOptions> = {}) {
        this.options = {
            headingSeparator: ".",
            navPage: "_nav",
            pageSeparator: "/",
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
        // navPage is used to construct the sidebar menu
        const navRoot = pages.get(this.options.navPage);
        if (navRoot === undefined) {
            console.warn(`navPage '${this.options.navPage}' not found, returning empty array.`);
            return [];
        }

        const roots = createNavigableTree(pages, navRoot).children as IPageNode[];
        // nav page is not a real docs page so we can remove it from output
        pages.remove(this.options.navPage);
        roots.forEach((page) => {
            if (isPageNode(page)) {
                page.children.forEach((child) => this.nestChildPage(pages, child, page));
            }
        });

        return roots;
    }

    private nestChildPage(pages: PageMap, child: IPageNode | IHeadingNode, parent: IPageNode) {
        const originalRef = child.reference;

        // update entry reference to include parent reference
        const separator = isPageNode(child) ? this.options.pageSeparator : this.options.headingSeparator;
        const nestedRef = [parent.reference, slugify(originalRef)].join(separator);
        child.reference = nestedRef;

        if (isPageNode(child)) {
            // rename nested pages to be <parent>.<child> and remove old <child> entry.
            // (we know this ref exists because isPageNode(child) and originalRef = child.reference)
            const page = pages.remove(originalRef)!;
            pages.set(nestedRef, { ...page, reference: nestedRef });
            // recurse through page children
            child.children.forEach((innerchild) => this.nestChildPage(pages, innerchild, child));
        }
    }
}

function createNavigableTree(pages: PageMap, page: IPageData, depth = 0) {
    const pageNode: IPageNode = initPageNode(page, depth);
    if (page.contents != null) {
        page.contents.forEach((node: StringOrTag, i: number) => {
            if (isTag(node)) {
                if (node.tag === "page") {
                    const subpage = pages.get(node.value);
                    if (subpage === undefined) {
                        throw new Error(`Unknown @page '${node.value}' referenced in '${page.reference}'`);
                    }
                    pageNode.children.push(createNavigableTree(pages, subpage, depth + 1));
                }
                if (i !== 0 && node.tag.match(/^#+$/)) {
                    // use heading strength - 1 cuz h1 is the title
                    pageNode.children.push(initHeadingNode(node.value, depth + node.tag.length - 1));
                }
            }
        });
    }
    return pageNode;
}

function initPageNode({ reference, title }: IPageData, depth: number): IPageNode {
    return { children: [], depth, reference, title };
}

function initHeadingNode(title: string, depth: number): IHeadingNode {
    return { depth, reference: slugify(title), title };
}
