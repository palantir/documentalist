/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as path from "path";
import { IHeadingNode, IPageData, IPageNode, isTag, slugify } from "./client";

export type PartialPageData = Pick<IPageData, "absolutePath" | "contentRaw" | "contents" | "metadata">;

export class PageMap {
    private pages: Map<string, IPageData> = new Map();

    /**
     * Adds a new page to the map. Generates title and reference from partial data.
     * Use this for ingesting rendered blocks.
     */
    public add(data: PartialPageData) {
        const page: IPageData = {
            reference: getReference(data),
            title: getTitle(data),
            ...data,
        };
        this.set(page.reference, page);
        return page;
    }

    /** Returns the page with the given ID or `undefined` if not found. */
    public get(id: string) {
        return this.pages.get(id);
    }

    /** Removes the page with the given ID and returns it or `undefined` if not found. */
    public remove(id: string) {
        const page = this.get(id);
        if (page !== undefined) {
            this.pages.delete(id);
        }
        return page;
    }

    /**
     * Sets the page data at the given ID, when you already have a full page object.
     * Warns if a page with this ID already exists.
     */
    public set(id: string, page: IPageData) {
        if (this.pages.has(id)) {
            console.warn(`Found duplicate page "${id}"; overwriting previous data.`);
            console.warn("Rename headings or use metadata `reference` key to disambiguate.");
        }
        this.pages.set(id, page);
    }

    public forEach(iterator: (page: IPageData, id: string) => void) {
        this.pages.forEach(iterator);
    }

    /** Returns a JS object mapping page IDs to data. */
    public toObject() {
        const object: { [key: string]: IPageData } = {};
        for (const [key, val] of this.pages.entries()) {
            object[key] = val;
        }
        return object;
    }

    public toTree() {
        const itemsById = new Map<string, IPageNode>();
        // create sparse map of node for each page with empty children
        this.forEach((page) => itemsById.set(page.reference, initPageNode(page)));
        // fill out children and set parent references on each child
        // by traversing contents looking for @page or @#+
        this.forEach((page) => {
            const pageNode = itemsById.get(page.reference)!;
            page.contents.forEach((node, i) => {
                if (isTag(node)) {
                    if (node.tag === "page") {
                        const subpage = itemsById.get(node.value);
                        if (subpage === undefined) {
                            throw new Error(`Unknown @page '${node.value}' referenced in '${page.reference}'`);
                        }
                        subpage.parentReference = page.reference;
                        subpage.depth = pageNode.depth + 1;
                        pageNode.children.push(subpage);
                    } else if (i > 0 && node.tag.match(/^#+$/)) {
                        pageNode.children.push(initHeadingNode(node.value, pageNode.depth + node.tag.length));
                    }
                }
            });
        });
        // return array of roots -- nodes with undefined parent
        const roots: IPageNode[] = [];
        itemsById.forEach((node) => {
            if (node.parentReference === undefined) {
                roots.push(node);
            }
        });
        return roots;
    }
}

function initPageNode({ reference, title }: IPageData, depth: number = 0): IPageNode {
    return { children: [], depth, reference, title };
}

function initHeadingNode(title: string, depth: number): IHeadingNode {
    return { depth, reference: slugify(title), title };
}

function getReference(data: PartialPageData) {
    if (data.metadata.reference != null) {
        return data.metadata.reference;
    }
    return path.basename(data.absolutePath, path.extname(data.absolutePath));
}

function getTitle(data: PartialPageData) {
    if (data.metadata.title !== undefined) {
        return data.metadata.title;
    }

    const first = data.contents[0];
    if (isTag(first) && first.tag.match(/^#+$/)) {
        return first.value as string;
    }

    return "(untitled)";
}
