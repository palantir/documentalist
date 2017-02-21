import { IInterfaceEntry } from "./plugins/typescript";

/** Represents a single `@tag <value>` line from a file. */
export interface ITag {
    tag: string;
    value: string;
}

/** An entry in `contents` array: either an HTML string or an `@tag`. */
export type StringOrTag = string | ITag;

/** type guard to determine if a `contents` node is an `@tag` statement */
export function isTag(node: StringOrTag): node is ITag {
    return (node as ITag).tag !== undefined;
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

    /** Human-friendly title of this page. */
    title: string;
}

/**
 * The root type of data exported by Documentalist.
 * Each plugin emits its data in a separate key.
 */
export interface IDocumentalistData {
    docs: { [key: string]: IPageData };
    ts: IInterfaceEntry[];
    [plugin: string]: any;
}

/** One page entry in a layout tree. */
export interface ITreeEntry {
    depth?: number;
    reference: string;
    title: string;
}

/** A page has ordered children composed of `@#+` and `@page` tags. */
export interface IPageNode extends ITreeEntry {
    children: Array<IPageNode | IHeadingNode>;
}

/** An `@#+` tag belongs to a specific page. */
export interface IHeadingNode extends ITreeEntry {
    pageReference: string;
}

/** Type guard for `IPageNode`, useful for its `children` array. */
export function isPageNode(node: any): node is IPageNode {
    return (node as IPageNode).children !== undefined;
}

/** Merge an array of strings into one handy slug. */
export function slugify(...strings: string[]) {
    return strings.map((str) => str.toLowerCase().replace(/\W/g, "-")).join(".");
}

function initPageNode({ reference, title }: IPageData, depth: number): IPageNode {
    return { children: [], depth, reference, title };
}

function initHeadingNode({ value }: ITag, depth: number, pageReference: string): IHeadingNode {
    const reference = slugify(pageReference, value);
    return { depth, pageReference, reference, title: value };
}

/**
 * Organizes the pages into a tree structure by traversing
 * their contents for `@#+` and `@page` tags.
 */
export function createNavigableTree(pages: { [key: string]: IPageData }, page: IPageData, depth = 0) {
    const pageNode: IPageNode = initPageNode(page, depth);
    if (page.contents != null) {
        page.contents.forEach((node: StringOrTag, i: number) => {
            if (isTag(node)) {
                if (node.tag === "page") {
                    const subpage = pages[node.value as string];
                    if (subpage === undefined) {
                        throw new Error(`Unknown @page '${node.value}' referenced in '${page.reference}'`);
                    }
                    pageNode.children.push(createNavigableTree(pages, subpage, depth + 1));
                }
                if (i !== 0 && node.tag.match(/^#+$/)) {
                    pageNode.children.push(initHeadingNode(node, node.tag.length, page.reference));
                }
            }
        });
    }
    return pageNode;
}
