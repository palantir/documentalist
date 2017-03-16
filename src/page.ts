/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as path from "path";
import { IPageData, isTag } from "./client";

export type PartialPageData = Pick<IPageData, "absolutePath" | "contentRaw" | "contents" | "metadata">;

export function makePage(props: PartialPageData): IPageData {
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

export class PageMap {
    private pages: Map<string, IPageData> = new Map();

    public get(id: string) {
        if (this.pages.has(id)) {
            return this.pages.get(id)!;
        } else {
            throw new Error(`Unknown page: ${id}`);
        }
    }

    public add(data: PartialPageData) {
        const page = makePage(data);
        if (this.pages.has(page.reference)) {
            console.warn(`Found duplicate page "${page.reference}"; overwriting previous data.`);
            console.warn("Rename headings or use metadata `reference` key to disambiguate.");
        }
        this.pages.set(page.reference, page);
        return page;
    }

    public update(id: string, data: Partial<IPageData>) {
        if (!this.pages.has(id)) {
            throw new Error(`Unknown page: ${id}`);
        }
        const page = this.pages.get(id)!;
        this.pages.set(id, { ...page, ...data });
    }

    public toObject() {
        const object: { [key: string]: IPageData } = {};
        for (const [key, val] of this.pages.entries()) {
            object[key] = val;
        }
        return object;
    }
}
