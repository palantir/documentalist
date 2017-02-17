import { readFileSync } from "fs";
import * as path from "path";

import { ContentNode, Documentalist } from "..";
import { Page } from "../page";
import { IPlugin } from "./plugin";

export interface ITreeEntry {
    depth?: number;
    reference: string;
    title: string;
}

export interface ITreeNode extends ITreeEntry {
    children: ITreeNode[];
    parent: string | undefined;
    sections: ITreeEntry[];
}

export class MarkdownPlugin implements IPlugin {
    public name = "docs";

    /** A map of page reference to page data */
    private pages: Map<string, Page> = new Map();

    public compile(documentalist: Documentalist, markdownFiles: string[]) {
        this.parsePages(documentalist, markdownFiles);
        return {
            // layout: this.tree(),
            pages: this.read(),
        } as any;
        // TODO clear pages after compile
    }

    /**
     * Reads the given set of markdown files and adds their data to the internal storage.
     * Returns an array of the new references added.
     */
    public parsePages(documentalist: Documentalist, markdownFiles: string[]) {
        return markdownFiles
            .map<Page>((filepath) => {
                const absolutePath = path.resolve(filepath);
                const fileContents = readFileSync(absolutePath, "utf8");
                const { content, metadata, renderedContent } = documentalist.renderBlock(fileContents);
                const page = new Page({
                    absolutePath,
                    contentRaw: content,
                    contents: renderedContent,
                    metadata,
                });
                const ref = page.reference;
                if (this.pages.has(ref)) {
                    console.warn(`Found duplicate reference "${ref}"; overwriting previous data.`);
                    console.warn("Rename headings or use metadata `reference` key to disambiguate.");
                }
                this.pages.set(ref, page);
                return page;
            })
            .map((page) => {
                if (page.data.contents) {
                    const newContent = page.data.contents.reduce((array, content) => {
                        if (content === "") {
                            return array;
                        }
                        if (typeof content === "string" || content.tag !== "include") {
                            return array.concat(content);
                        }
                        const pageToInclude = this.pages.get(content.value as string);
                        if (pageToInclude === undefined) {
                            throw new Error(`Unknown @include reference '${content.value}' in '${page.reference}'`);
                        }
                        return array.concat(pageToInclude.data.contents!);
                    }, [] as ContentNode[]);
                    page.data.contents = newContent;
                }
                return page;
            });
    }

    /** Returns a plain object mapping page references to their data. */
    public read() {
        const object: { [key: string]: Page } = {};
        for (const [key, val] of this.pages.entries()) {
            object[key] = val;
        }
        return object;
    }

    /**
     * Attempt to produce a tree layout of known pages.
     * Path structure is used to nest pages.
     */
    // public tree() {
    //     const pageNodes: Map<string, ITreeNode> = new Map();

    //     // sparse map of tree nodes with empty `children`
    //     for (const [ref, page] of this.pages) {
    //         // first heading becomes page title
    //         const thisPage: ITreeNode = {
    //             children: [],
    //             parent: page.data.metadata.parent,
    //             reference: ref,
    //             sections: headings.map((h) => ({ depth: h.lvl, reference: [ref, h.slug].join("."), title: h.content })),
    //             title: title.content,
    //         };
    //         pageNodes.set(ref, thisPage);
    //     }

    //     // populate `children` using parent references
    //     for (const page of pageNodes.values()) {
    //         if (page.parent !== undefined) {
    //             if (!pageNodes.has(page.parent)) {
    //                 throw new Error(`Unknown parent reference '${page.parent}' in '${page.reference}'`);
    //             }
    //             pageNodes.get(page.parent)!.children.push(page);
    //         }
    //     }

    //     // now find the roots (nodes without parents)
    //     const roots: ITreeNode[] = [];
    //     for (const page of pageNodes.values()) {
    //         page.children.sort(alphabetizeNodesByTitle);
    //         if (page.parent === undefined) {
    //             roots.push(page);
    //         }
    //     }
    //     return roots;
    // }
}

// function alphabetizeNodesByTitle(a: ITreeNode, b: ITreeNode) {
//     return a.title.localeCompare(b.title);
// }
