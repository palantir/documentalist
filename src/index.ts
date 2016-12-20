import * as toc from "markdown-toc";
import * as path from "path";
import * as Remarkable from "remarkable";
import { TreeNode } from "./";
import * as utils from "./utils";

export type TreeNode = { children: TreeDict, sections: string[], reference: string };
export type TreeDict = Map<string, TreeNode>;

export type PageObject = { [child: string]: PageObject };

export interface IOptions {
    // TODO: expose all Remarkable options?

    /**
     * What form of `contents` to return for each page:
     * - `false` will omit the contents from the output data.
     * - `"html"` will return rendered HTML contents _(default)_.
     * - `"raw"` will return raw unprocessed markdown contents.
     * @default "html"
     */
    contents: false | "html" | "raw";

    /**
     * CSS class for anchor inside headings.
     * TODO: is this enough customization? or provide render callback?
     */
    headingAnchorClassName: string;

    /** Expose syntax highlighting so user can choose highlighter and languages. */
    highlight: (source: string, language: string) => string;
}

export interface IMetadata {
    /**
     * The section reference to which this page belongs.
     * A reference is typically the first header of a file, but can be overridden in IMetadata.
     */
    page?: string;

    /**
     * Unique ID for finding this section.
     * The default value is the slug of the first heading in the file.
     */
    reference?: string;
}

export interface IPageData<M extends IMetadata> {
    contents?: string;
    headings: toc.Heading[];
    metadata: M;
    path: string;
}

export default class Documentalist {
    public markdown: Remarkable;

    /** A map of page reference to page data */
    private data: Map<string, IPageData<IMetadata>> = new Map();

    private options: IOptions;

    constructor(options: Partial<IOptions> = {}) {
        this.options = {
            contents: "html",
            headingAnchorClassName: "docs-anchor",
            highlight: (source) => source,
            ...options,
        };

        this.markdown = new Remarkable({
            highlight: this.options.highlight,
            html: true,
            langPrefix: "",
        });

        this.markdown.renderer.rules["heading_open"] = (tokens, index) => {
            const slug = toc.slugify(tokens[index + 1].content);
            return `<h${tokens[index].hLevel} id="${slug}">`
                + `<a class="${this.options.headingAnchorClassName || ""}" href="#${slug}">#</a>`
                + "&nbsp;";
        };
    }

    /**
     * Reads the given set of markdown files and adds their data to the internal storage.
     * Returns an array of the new references added.
     */
    public add(...filepaths: string[]) {
        return filepaths
            .map(utils.readFile)
            .map(utils.extractMetadata)
            .map((data, index) => ({
                ...data,
                headings: toc(data.contents).json,
                path: path.resolve(filepaths[index]),
            }))
            .map<IPageData<IMetadata>>((data) => {
                // process `contents` based on corresponding option.
                // at this point, `contents` becomes an optional property.
                const { contents } = this.options;
                if (contents === false) {
                    delete data.contents;
                } else if (contents === "html") {
                    data.contents = this.markdown.render(data.contents);
                }
                return data;
            })
            .map((data) => {
                const ref = this.getPageReference(data);
                if (this.data.has(ref)) {
                    console.warn(`Found duplicate reference "${ref}"; overwriting previous data.`);
                    console.warn("Rename headings or use metadata `reference` key to disambiguate.");
                }
                this.data.set(ref, data);
                return ref;
            });
    }

    /** Returns the data for a given page reference, if it exists. */
    public get(ref: string) { return this.data.get(ref); }

    /** Returns a plain object mapping page references to their data. */
    public read() {
        const object: { [key: string]: IPageData<IMetadata> } = {};
        for (const [key, val] of this.data.entries()) {
            object[key] = val;
        }
        return object;
    }

    /**
     * Attempt to produce a tree layout of known pages.
     * Path structure is used to nest pages.
     */
    public tree() {
        const roots: TreeDict = new Map();

        for (const [ref, data] of this.data) {
            const thisPage: TreeNode = {
                children: new Map(),
                reference: ref,
                sections: data.headings.map((h) => h.slug),
            };
            if (data.metadata.page == null) {
                roots.set(ref, thisPage);
            } else {
                const pageRef = data.metadata.page; // .split(".");
                let page = roots.get(pageRef);
                if (page == null) {
                    page = {
                        children: new Map(),
                        reference: pageRef,
                        sections: [],
                    };
                    roots.set(pageRef, page);
                }
                page.children.set(ref, thisPage);
            }
        }

        return roots;
    }

    private getPageReference(page: IPageData<IMetadata>) {
        if (page.metadata.reference != null) {
            return page.metadata.reference;
        } else if (page.headings.length > 0) {
            return page.headings[0].slug;
        } else {
            return path.basename(page.path, path.extname(page.path));
        }
    }
}
