import * as toc from "markdown-toc";
import * as path from "path";
import { readFileSync } from "fs";

import { IPlugin } from "./plugin";
import { IMetadata, Page } from "../page";
import { Documentalist } from "..";

export type TreeNode = { children: TreeDict, sections: string[], reference: string };
export type TreeDict = { [page: string]: TreeNode };
type DocPage = Page<IMetadata>;

export class MarkdownPlugin implements IPlugin {
    /** A map of page reference to page data */
    private pages: Map<string, DocPage> = new Map();

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
            .map<DocPage>((filepath) => {
                const absolutePath = path.resolve(filepath);
                const fileContents = readFileSync(absolutePath, "utf8");
                const { content, metadata, renderedContent } = documentalist.renderBlock(fileContents);
                const page = new Page<IMetadata>({
                    absolutePath,
                    contents: renderedContent,
                    contentRaw: content,
                    heading: toc(content).json,
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
        const object: { [key: string]: DocPage } = {};
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
        const roots: TreeDict = {};

        for (const [ref, page] of this.pages) {
            const { heading, metadata } = page.data;
            const thisPage: TreeNode = {
                children: {},
                reference: ref,
                sections: heading.map((h) => h.slug),
            };
            if (metadata.parent == null) {
                roots[ref] = { ...thisPage, ...roots[ref] };
            } else {
                const parentRef = metadata.parent; // TODO: .split(".");
                let parent = roots[parentRef];
                if (parent == null) {
                    // fake minimal page so we can add children.
                    // expecting rest of data to come along later.
                    parent = { children: {} } as TreeNode;
                    roots[parentRef] = parent;
                }
                parent.children[ref] = thisPage;
            }
        }

        return roots;
    }
}
