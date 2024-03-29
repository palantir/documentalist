/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HeadingNode, isHeadingTag, isTag, PageData, PageNode } from "@documentalist/client";

export class PageMap {
    private store: Map<string, PageData> = new Map();

    /** Returns an iterator for all the pages (values) in the map. */
    public pages() {
        return Array.from(this.store.values());
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
    public set(id: string, page: PageData) {
        if (this.store.has(id)) {
            console.warn(`Found duplicate page "${id}"; overwriting previous data.`);
            console.warn("Rename headings or use metadata `reference` key to disambiguate.");
        }
        this.store.set(id, page);
    }

    /** Returns a JS object mapping page IDs to data. */
    public toObject() {
        const object: { [key: string]: PageData } = {};
        for (const [key, val] of Array.from(this.store.entries())) {
            object[key] = val;
        }
        return object;
    }

    public toTree(id: string, depth = 0): PageNode {
        const page = this.get(id);
        if (page === undefined) {
            throw new Error(`Unknown @page '${id}' in toTree()`);
        }
        const pageNode = initPageNode(page, depth);
        page.contents.forEach(node => {
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

function initPageNode({ reference, title }: PageData, level: number = 0): PageNode {
    // NOTE: `route` may be overwritten in MarkdownPlugin based on nesting.
    return { children: [], level, reference, route: reference, title };
}

function initHeadingNode(title: string, level: number): HeadingNode {
    // NOTE: `route` will be populated in MarkdownPlugin.
    return { title, level, route: "" };
}
