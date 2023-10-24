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

/** Represents a single `@tag <value>` line from a file. */
export interface Tag {
    /** Tag name. */
    tag: string;

    /** Tag value, exactly as written in source. */
    value: string;
}

/**
 * The basic components of a navigable resource: a "route" at which it can be accessed and
 * its depth in the layout hierarchy. Heading tags and hierarchy nodes both extend this interface.
 */
export interface Navigable {
    /** Fully-qualified route of the heading, which can be used as anchor `href`. */
    route: string;

    /** Level of heading, from 1-6. Dictates which `<h#>` tag to render. */
    level: number;
}

/**
 * Represents a single `@#+ <value>` heading tag from a file. Note that all `@#+` tags
 * (`@#` through `@######`) are emitted as `tag: "heading"` so only one renderer is necessary to
 * capture all six levels.
 *
 * Heading tags include additional information over regular tags: fully-qualified `route` of the
 * heading (which can be used as anchor `href`), and `level` to determine which `<h#>` tag to use.
 */
export interface HeadingTag extends Tag, Navigable {
    tag: "heading";
}

/** An entry in `contents` array: either an HTML string or an `@tag`. */
export type StringOrTag = string | Tag;

/**
 * Type guard to determine if a `contents` node is an `@tag` statement.
 * Optionally tests tag name too, if `tagName` arg is provided.
 */
export function isTag(node: any, tagName?: string): node is Tag {
    return node != null && (node as Tag).tag != null && (tagName == null || (node as Tag).tag === tagName);
}

/** Type guard to deterimine if a `contents` node is an `@#+` heading tag. */
export function isHeadingTag(node: any): node is HeadingTag {
    return isTag(node, "heading");
}
