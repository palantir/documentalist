/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as path from "path";
import { IPageData, isTag } from "./client";

export type PartialPageData = Pick<IPageData, "absolutePath" | "contentRaw" | "contents" | "metadata">;

export class PageMap {
    private pages: Map<string, IPageData> = new Map();

    /**
     * Adds a new page to the map. Generates title and reference from partial data.
     * Use this for ingesting rendered blocks.
     */
    public add(data: PartialPageData) {
        const page = makePage(data);
        this.set(page.reference, page);
        return page;
    }

    /** Returns the page with the given ID, or throws an error if not found. */
    public get(id: string) {
        if (this.pages.has(id)) {
            return this.pages.get(id)!;
        } else {
            throw new Error(`Unknown page: ${id}`);
        }
    }

    /** Removes the page with the given ID and returns it, or throws an error if not found. */
    public remove(id: string) {
        const page = this.get(id);
        this.pages.delete(id);
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

    /** Returns a JS object mapping page IDs to data. */
    public toObject() {
        const object: { [key: string]: IPageData } = {};
        for (const [key, val] of this.pages.entries()) {
            object[key] = val;
        }
        return object;
    }
}

function makePage(props: PartialPageData): IPageData {
    const title = getTitle(props);
    const reference = getReference(props);
    return { ...props, reference, title };
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
