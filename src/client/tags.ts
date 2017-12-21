/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

/** Represents a single `@tag <value>` line from a file. */
export interface ITag {
    /** Tag name. */
    tag: string;

    /** Tag value, exactly as written in source. */
    value: string;
}

/**
 * The basic components of a navigable resource: a "route" at which it can be accessed and
 * its depth in the layout hierarchy. Heading tags and hierarchy nodes both extend this interface.
 */
export interface INavigable {
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
export interface IHeadingTag extends ITag, INavigable {
    tag: "heading";
}

/** An entry in `contents` array: either an HTML string or an `@tag`. */
export type StringOrTag = string | ITag;
