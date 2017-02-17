import { readFileSync } from "fs";
import * as path from "path";

import { ContentNode, Documentalist } from "..";
import { IPageData, makePage } from "../page";
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

    /** Returns a plain object mapping page references to their data. */
    public compile(documentalist: Documentalist, markdownFiles: string[]) {
        const pageStore = this.parsePages(documentalist, markdownFiles);

        const object: { [key: string]: IPageData } = {};
        for (const [key, val] of pageStore.entries()) {
            object[key] = val;
        }
        return object;
    }

    /**
     * Reads the given set of markdown files and adds their data to the internal storage.
     * Returns an array of the new references added.
     */
    public parsePages(documentalist: Documentalist, markdownFiles: string[]) {
        const pageStore: Map<string, IPageData> = new Map();
        markdownFiles
            .map((filepath) => {
                const absolutePath = path.resolve(filepath);
                const fileContents = readFileSync(absolutePath, "utf8");
                const { content, metadata, renderedContent } = documentalist.renderBlock(fileContents);
                const page = makePage({
                    absolutePath,
                    contentRaw: content,
                    contents: renderedContent,
                    metadata,
                });
                const ref = page.reference;
                if (pageStore.has(ref)) {
                    console.warn(`Found duplicate reference "${ref}"; overwriting previous data.`);
                    console.warn("Rename headings or use metadata `reference` key to disambiguate.");
                }
                pageStore.set(ref, page);
                return page;
            })
            .map((page) => {
                if (page.contents) {
                    const newContent = page.contents.reduce((array, content) => {
                        if (typeof content === "string" || content.tag !== "include") {
                            return array.concat(content);
                        }
                        const pageToInclude = pageStore.get(content.value as string);
                        if (pageToInclude === undefined) {
                            throw new Error(`Unknown @include reference '${content.value}' in '${page.reference}'`);
                        }
                        return array.concat(pageToInclude.contents!);
                    }, [] as ContentNode[]);
                    page.contents = newContent;
                }
                return page;
            });
        return pageStore;
    }
}
