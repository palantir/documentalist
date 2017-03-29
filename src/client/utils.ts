/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { IHeadingTag, IPageNode, ITag } from "./index";

/** Slugify a string: "Really Cool Heading!" => "really-cool-heading-" */
export function slugify(str: string) {
    return str.toLowerCase().replace(/[^\w.\/]/g, "-");
}

/**
 * Type guard to determine if a `contents` node is an `@tag` statement.
 * Optionally tests tag name too, if `tagName` arg is provided.
 */
export function isTag(node: any, tagName?: string): node is ITag {
    return node != null && (node as ITag).tag !== undefined
        && (tagName === undefined || (node as ITag).tag === tagName);
}

/** Type guard to deterimine if a `contents` node is an `@#+` heading tag. */
export function isHeadingTag(node: any): node is IHeadingTag {
    return isTag(node, "heading");
}

/** Type guard for `IPageNode`, useful for its `children` array. */
export function isPageNode(node: any): node is IPageNode {
    return node != null && (node as IPageNode).children != null;
}
