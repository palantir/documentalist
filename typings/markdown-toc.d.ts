declare module "markdown-toc" {
    import * as Remarkable from "remarkable";

    function toc(markdown: string, options?: toc.Options): toc.TableOfContents;

    namespace toc {
        interface Options {
            append?: string;
            bullets?: string | string[];
            filter?: (str: string, ele: Object, arr: string[]) => boolean;
            firsth1?: boolean;
            maxdepth?: number;
            slugify?: (str: string) => string;
        }

        interface Heading {
            content: string;
            i: number;
            lvl: number;
            seen: number;
            slug: string;
        }

        interface TableOfContents {
            /** Array of heading objects for creating a custom TOC. */
            json: toc.Heading[];

        }

        /**
         * Insert a table of contents immediately after an opening `<!-- toc -->` code comment, or replace
         * an existing TOC if both an opening comment and a closing comment (`<!-- tocstop -->`) are found.
         *
         * _(This strategy works well since code comments in markdown are hidden when viewed as HTML,
         * like when viewing a README on GitHub README for example)._
         *
         * @returns a new markdown string that includes the table of contents
         */
        function insert(markdown: string): string;

        /**
         * Use as a Remarkable plugin:
         *
         * `new Remarkable().use(toc.plugin(options))`
         */
        function plugin(options?: Options): Remarkable.Plugin<Options>;

        // TODO: utility functions https://github.com/jonschlinkert/markdown-toc#utility-functions
        function slugify(source: string): string;
    }

    export = toc;
}
