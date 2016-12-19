import * as toc from "markdown-toc";
import * as path from "path";
import * as Remarkable from "remarkable";

import * as utils from "./utils";

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
    /** the section ID to which this page belongs */
    section?: string;
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
                const ref = data.headings[0].slug;
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
    public tree(cwd: string) {
        let root: PageObject = {};
        for (const [ref, data] of this.data) {
            // TODO: this is a dumb way of doing this :(
            const namespaces = path.relative(cwd, path.dirname(data.path)).split("/").slice(0, -1);
            namespaces.push(ref);
            root = utils.namespaceify(namespaces, root);
        }
        return root;
    }
}
