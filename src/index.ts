import * as fs from "fs";
import * as yaml from "js-yaml";
import * as toc from "markdown-toc";
import * as Remarkable from "remarkable";

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

export default class Documentarian {
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
            .sort((a, b) => b.localeCompare(a))
            .map(readFile)
            .map(extractMetadata)
            .map((data, index) => ({
                ...data,
                headings: toc(data.contents).json,
                path: filepaths[index],
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

    /**
     * Attempt to produce a tree layout of known pages.
     * Metadata `section` field is used to nest a page inside another page.
     */
    public tree() {
        const pages: any = {};
        this.data.forEach((data) => {
            const title = data.headings[0].content;
            const section = data.metadata.section;

            if (section === undefined) {
                pages[title] = {} as any;
                return;
            }

            if (pages[section] === undefined) {
                pages[section] = {} as any;
            }
            pages[section][title] = {} as any;
        });
        return pages;
    }
}

/**
 * UTILITY FUNCTIONS
 */

const METADATA_REGEX = /^---\n?((?:.|\n)*)\n---\n/;
function extractMetadata(markdown: string) {
    const match = METADATA_REGEX.exec(markdown);
    if (match === null) {
        return { contents: markdown, metadata: {} };
    }
    const contents = markdown.substr(match[0].length);
    return { contents, metadata: yaml.load(match[1]) };
}

function readFile(path: string) {
    return fs.readFileSync(path, "utf-8");
}
