import { StringOrTag } from "./plugins/plugin";
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
 * Represents a single `@#+ <value>` heading tag from a file. Note that all `@#+` tags
 * (`@#` through `@######`) are emitted as `tag: "heading"` so only one renderer is necessary to
 * capture all six levels.
 *
 * Heading tags include additional information over regular tags: fully-qualified `route` of the
 * heading (which can be used as anchor `href`), and `level` to determine which `<h#>` tag to use.
 */
export interface IHeadingTag extends ITag {
    tag: "heading";
    /** Fully-qualified route of the heading, which can be used as anchor `href`. */
    route: string;
    /** Level of heading, from 1-6. Dictates which `<h#>` tag to render. */
    level: number;
}

/** An entry in `contents` array: either an HTML string or an `@tag`. */
export type StringOrTag = string | ITag;

/**
 * Type guard to determine if a `contents` node is an `@tag` statement.
 * Optionally tests tag name too, if `tagName` arg is provided.
 */
export function isTag(node: StringOrTag, tagName?: string): node is ITag {
    return node != null && (node as ITag).tag !== undefined
        && (tagName === undefined || (node as ITag).tag === tagName);
}

/** Type guard to deterimine if a `contents` node is an `@#+` heading tag. */
export function isHeadingTag(node: StringOrTag): node is IHeadingTag {
    return isTag(node, "heading");
}

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
     * @default value of first `@#` tag
     */
    title?: string;

    [key: string]: any;
}

/**
 * A single Documentalist page, parsed from a single source file.
 */
export interface IPageData {
    /** Absolute path of source file. */
    absolutePath: string;

    /** Raw unmodified contents of source file (excluding the metadata). */
    contentRaw: string;

    /** Parsed nodes of source file. An array of rendered HTML strings or `@tag` objects. */
    contents: StringOrTag[];

    /** Arbitrary YAML metadata parsed from front matter of source file */
    metadata: IMetadata;

    /** Unique identifier for addressing this page. */
    reference: string;

    /** Fully qualified route to this page: slash-separated references of all parent pages. */
    route: string;

    /** Human-friendly title of this page. */
    title: string;
}

/** One page entry in a layout tree. */
export interface ITreeEntry {
    depth: number;
    route: string;
    title: string;
}

/** A page has ordered children composed of `@#+` and `@page` tags. */
export interface IPageNode extends ITreeEntry {
    reference: string;
    children: Array<IPageNode | IHeadingNode>;
}

/** An `@#+` tag belongs to a specific page. */
// tslint:disable-next-line:no-empty-interface
export interface IHeadingNode extends ITreeEntry {
}

/** Type guard for `IPageNode`, useful for its `children` array. */
export function isPageNode(node: any): node is IPageNode {
    return (node as IPageNode).children !== undefined;
}

/** Slugify a string: "Really Cool Heading!" => "really-cool-heading-" */
export function slugify(str: string) {
    return str.toLowerCase().replace(/[^\w.\/]/g, "-");
}
