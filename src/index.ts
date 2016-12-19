import * as fs from "fs";
import * as yaml from "js-yaml";
import * as toc from "markdown-toc";
import * as Remarkable from "remarkable";

const METADATA_REGEX = /^---\n?((?:.|\n)*)\n---\n/;

export interface IOptions {
    // TODO: expose all Remarkable options?

    /**
     * CSS class for anchor inside headings.
     * TODO: is this enough customization? or provide render callback?
     */
    headingAnchorClassName?: string;

    /** Expose syntax highlighting so user can choose highlighter and languages. */
    highlight?: (source: string, language: string) => string;
}

export interface IMetadata {
    /** the section ID to which this page belongs */
    section?: string;
}

export interface IPageData<M extends IMetadata> {
    contents: string;
    headings: toc.Heading[];
    metadata: M;
    path: string;
}

export default class Documentarian {
    public markdown: Remarkable;

    /** A map of page reference to page data */
    private data: Map<string, IPageData<IMetadata>> = new Map();

    constructor(options: IOptions = {}) {
        this.markdown = new Remarkable({
            highlight: options.highlight,
            html: true,
            langPrefix: "",
        });

        this.markdown.renderer.rules["heading_open"] = (tokens, index) => {
            const slug = toc.slugify(tokens[index + 1].content);
            return `<h${tokens[index].hLevel} id="${slug}">`
                + `<a class="${options.headingAnchorClassName || ""}" href="#${slug}">#</a>`
                + "&nbsp;";
        };
    }

    public add(...filepaths: string[]) {
        filepaths.sort((a, b) => b.localeCompare(a));
        filepaths.map<IPageData<any>>((filepath) => {
            const contents = fs.readFileSync(filepath, "utf-8");
            const match = METADATA_REGEX.exec(contents);
            if (match === null) {
                return {
                    contents: this.markdown.render(contents),
                    headings: toc(contents).json,
                    metadata: {},
                    path: filepath,
                };
            } else {
                const mdContents = contents.substr(match[0].length);
                return {
                    contents: this.markdown.render(mdContents),
                    headings: toc(mdContents).json,
                    metadata: yaml.load(match[1]),
                    path: filepath,
                };
            }
        }).forEach((data) => {
            this.data.set(data.headings[0].slug, data)
        });
    }

    public get() { return this.data; }

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
