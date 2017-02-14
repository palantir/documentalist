import * as Remarkable from "remarkable";
import * as yaml from "js-yaml";
import * as toc from "markdown-toc";


export type ContentNode = string | { tag: string, value: string | true };

/** ignored @tag names */
const RESERVED_WORDS = [
    "import",
    "include",
];

/**
 *  matches the triple-dash metadata block on the first line of markdown file.
 * first capture group contains YAML content.
 */
const METADATA_REGEX = /^---\n?((?:.|\n)*)\n---\n/;
const TAG_REGEX = /^@(\w+)(?:\s([^$@]+))?$/;
const TAG_SPLIT_REGEX = /^(@[a-zA-Z\d]+(?:\s+[^\n]+)?)$/gm;

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

export class Documentalist {
    public markdown: Remarkable;
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

    public renderBlock(blockContent: string) {
        const { content, metadata } = this.extractMetadata(blockContent);
        const renderedContent = this.renderContents(content);
        return { content, metadata, renderedContent }
    }

    private renderContents(content: string, reservedTagWords = RESERVED_WORDS) {
        if (this.options.contents === false) {
            return undefined;
        }
        const splitContents = this.parseTags(content, reservedTagWords);
        if (this.options.contents === "html") {
            return splitContents.map((node) => typeof node === "string" ? this.markdown.render(node) : node);
        } else {
            return splitContents;
        }
    }

    /**
     * Extracts optional YAML frontmatter metadata block from the beginning of a
     * markdown file and parses it to a JS object.
     */
    private extractMetadata(text: string) {
        const match = METADATA_REGEX.exec(text);
        if (match === null) {
            return { content: text, metadata: {} };
        }

        const content = text.substr(match[0].length);
        return { content, metadata: yaml.load(match[1]) || {} };
    }

    private parseTags(content: string, reservedWords: string[]) {
        return content.split(TAG_SPLIT_REGEX).map((str): ContentNode => {
            const match = TAG_REGEX.exec(str);
            if (match === null || reservedWords.indexOf(match[1]) >= 0) {
                return str;
            } else {
                return {
                    tag: match[1],
                    value: match[2] || true,
                };
            }
        });
    }
}
