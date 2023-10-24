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

import { Block } from "./compiler";
import { Navigable } from "./tags";

/**
 * The `MarkdownPlugin` exports a map of markdown `pages` keyed by reference,
 * and a multi-rooted `nav` tree of page nodes.
 */
export interface MarkdownPluginData {
    /**
     * An ordered, nested, multi-rooted tree describing the navigation layout
     * of all the pages and their headings. The representation is constructued by
     * tracing `@page` and `@#+` tags.
     */
    nav: PageNode[];

    /** A map of page reference to data. */
    pages: {
        [reference: string]: PageData;
    };
}

/**
 * A single Documentalist page, parsed from a single source file.
 */
export interface PageData extends Block {
    /** Unique identifier for addressing this page. */
    reference: string;

    /** Fully qualified route to this page: slash-separated references of all parent pages. */
    route: string;

    /** Relative path from cwd to the original source file. */
    sourcePath: string;

    /** Human-friendly title of this page. */
    title: string;
}

/** An `@#+` tag belongs to a specific page. */
export interface HeadingNode extends Navigable {
    /** Display title of page heading. */
    title: string;
}

/** A page has ordered children composed of `@#+` and `@page` tags. */
export interface PageNode extends HeadingNode {
    /** Ordered list of pages and headings that appear on this page. */
    children: Array<PageNode | HeadingNode>;

    /** Unique reference of this page, used for retrieval from store. */
    reference: string;
}

/** Type guard for `PageNode`, useful for its `children` array. */
export function isPageNode(node: any): node is PageNode {
    return node != null && (node as PageNode).children != null;
}
