import { slugify } from "markdown-toc";
import * as Remarkable from "remarkable";
import { IMetadata, Page } from "./page";

type DocPage = Page<IMetadata>;

export type TreeNode = { children: TreeDict, sections: string[], reference: string };
export type TreeDict = { [page: string]: TreeNode };

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

export default class Documentalist {
    public markdown: Remarkable;

    /** A map of page reference to page data */
    private pages: Map<string, DocPage> = new Map();

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
            const slug = slugify(tokens[index + 1].content);
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
            .map<DocPage>(Page.fromFile)
            .map((page) => {
                // process `contents` based on corresponding option.
                // at this point, `contents` becomes an optional property.
                const { contents } = this.options;
                if (contents === false) {
                    delete page.data.contents;
                } else if (contents === "html") {
                    page.data.contents = this.markdown.render(page.data.contents);
                }
                return page;
            })
            .map((page) => {
                const ref = page.reference;
                if (this.pages.has(ref)) {
                    console.warn(`Found duplicate reference "${ref}"; overwriting previous data.`);
                    console.warn("Rename headings or use metadata `reference` key to disambiguate.");
                }
                this.pages.set(ref, page);
                return ref;
            });
    }

    /** Returns the data for a given page reference, if it exists. */
    public get(ref: string) { return this.pages.get(ref); }

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
            const { headings, metadata } = page.data;
            const thisPage: TreeNode = {
                children: {},
                reference: ref,
                sections: headings.map((h) => h.slug),
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
