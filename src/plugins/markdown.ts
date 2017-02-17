import { readFileSync } from "fs";
import * as toc from "markdown-toc";
import * as path from "path";

import { Documentalist } from "..";
import { Page } from "../page";
import { IPlugin } from "./plugin";

export interface ITreeEntry {
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
            layout: this.tree(),
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
                    headings: toc(content).json,
                    metadata,
                });
                const ref = page.reference;
                if (this.pages.has(ref)) {
                    console.warn(`Found duplicate reference "${ref}"; overwriting previous data.`);
                    console.warn("Rename headings or use metadata `reference` key to disambiguate.");
                }
                this.pages.set(ref, page);
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
    public tree() {
        const pageNodes: Map<string, ITreeNode> = new Map();

        // sparse map of tree nodes with empty `children`
        for (const [ref, page] of this.pages) {
            // first heading becomes page title
            const [title, ...headings] = page.data.headings;
            const thisPage: ITreeNode = {
                children: [],
                parent: page.data.metadata.parent,
                reference: ref,
                sections: headings.map((h) => ({ reference: h.slug, title: h.content })),
                title: title.content,
            };
            pageNodes.set(ref, thisPage);
        }

        // populate `children` using parent references
        for (const page of pageNodes.values()) {
            if (page.parent !== undefined) {
                if (!pageNodes.has(page.parent)) {
                    throw new Error(`Unknown parent reference '${page.parent}' in '${page.reference}'`);
                }
                pageNodes.get(page.parent)!.children.push(page);
            }
        }

        // now find the roots (nodes without parents)
        const roots: ITreeNode[] = [];
        for (const page of pageNodes.values()) {
            page.children.sort(alphabetizeNodesByTitle);
            if (page.parent === undefined) {
                roots.push(page);
            }
        }
        return roots;
    }
}

function alphabetizeNodesByTitle(a: ITreeNode, b: ITreeNode) {
    return a.title.localeCompare(b.title);
}
