/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as path from "path";
import { IBlock, IHeadingNode, IPageData, IPageNode, isHeadingTag, isTag } from "./client";

export type PartialPageData = Pick<IPageData, "absolutePath" | keyof IBlock>;

export class PageMap {
    private store: Map<string, IPageData> = new Map();

    /**
     * Adds a new page to the map. Generates title and reference from partial data.
     * Use this for ingesting rendered blocks.
     */
    public add(data: PartialPageData) {
        const reference = getReference(data);
        const page: IPageData = {
            route: reference,
            title: getTitle(data),
            reference,
            ...data,
        };
        this.set(reference, page);
        return page;
    }

    /** Returns the page with the given ID or `undefined` if not found. */
    public get(id: string) {
        return this.store.get(id);
    }

    /** Removes the page with the given ID and returns it or `undefined` if not found. */
    public remove(id: string) {
        const page = this.get(id);
        if (page !== undefined) {
            this.store.delete(id);
        }
        return page;
    }

    /**
     * Sets the page data at the given ID, when you already have a full page object.
     * Warns if a page with this ID already exists.
     */
    public set(id: string, page: IPageData) {
        if (this.store.has(id)) {
            console.warn(`Found duplicate page "${id}"; overwriting previous data.`);
            console.warn("Rename headings or use metadata `reference` key to disambiguate.");
        }
        this.store.set(id, page);
    }

    /** Returns a JS object mapping page IDs to data. */
    public toObject() {
        const object: { [key: string]: IPageData } = {};
        for (const [key, val] of this.store.entries()) {
            object[key] = val;
        }
        return object;
    }

    public toTree(id: string, depth = 0): IPageNode {
        const page = this.get(id);
        if (page === undefined) {
            throw new Error(`Unknown @page '${id}' in toTree()`);
        }
        const pageNode = initPageNode(page, depth);
        page.contents.forEach((node) => {
            // we only care about @page and @##+ tag nodes
            if (isTag(node, "page")) {
                pageNode.children.push(this.toTree(node.value, depth + 1));
            } else if (isHeadingTag(node) && node.level > 1) {
                // skipping h1 headings cuz they become the page title itself.
                pageNode.children.push(initHeadingNode(node.value, pageNode.level + node.level - 1));
            }
        });
        return pageNode;
    }
}

function initPageNode({ reference, title }: IPageData, level: number = 0): IPageNode {
    // NOTE: `route` may be overwritten in MarkdownPlugin based on nesting.
    return { children: [], level, reference, route: reference, title };
}

function initHeadingNode(title: string, level: number): IHeadingNode {
    // NOTE: `route` will be added in MarkdownPlugin.
    return { title, level } as IHeadingNode;
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
    if (isHeadingTag(first)) {
        return first.value;
    }

    return "(untitled)";
}
