/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

export * from "./kss";
export * from "./markdown";
export * from "./typescript";
export * from "./utils";

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

/** Represents a single `@tag <value>` line from a file. */
export interface ITag {
    /** Tag name. */
    tag: string;

    /** Tag value, exactly as written in source. */
    value: string;
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

/**
 * Metadata is parsed from YAML front matter in files and can contain arbitrary data.
 * A few keys are understood by Documentalist and, if defined in front matter,
 * will override default behavior.
 *
 * ```md
 * ---
 * reference: overview
 * title: "Welcome to the Jungle"
 * ---
 * actual contents of file...
 * ```
 */
export interface IMetadata {
    /**
     * Unique ID for addressing this page.
     * @default filename without extension
     */
    reference?: string;

    /**
     * Human-friendly title of this page, for display in the UI.
     * @default first heading tag
     */
    title?: string;

    // Supports arbitrary string keys.
    [key: string]: any;
}

/**
 * The output of `renderBlock` which parses a long form documentation block into
 * metadata, rendered markdown, and tags.
 */
export interface IBlock {
    /** Parsed nodes of source file. An array of markdown-rendered HTML strings or `@tag` objects. */
    contents: StringOrTag[];

    /** Raw unmodified contents of source file (excluding the metadata). */
    contentsRaw: string;

    /** Arbitrary YAML metadata parsed from front matter of source file, if any, or `{}`. */
    metadata: IMetadata;
}

/**
 * A single Documentalist page, parsed from a single source file.
 */
export interface IPageData extends IBlock {
    /** Unique identifier for addressing this page. */
    reference: string;

    /** Fully qualified route to this page: slash-separated references of all parent pages. */
    route: string;

    /** Human-friendly title of this page. */
    title: string;
}

/** An `@#+` tag belongs to a specific page. */
export interface IHeadingNode extends INavigable {
    /** Display title of page heading. */
    title: string;
}

/** A page has ordered children composed of `@#+` and `@page` tags. */
export interface IPageNode extends IHeadingNode {
    /** Ordered list of pages and headings that appear on this page. */
    children: Array<IPageNode | IHeadingNode>;

    /** Unique reference of this page, used for retrieval from store. */
    reference: string;
}
