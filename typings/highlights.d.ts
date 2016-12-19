declare module "highlights" {
    namespace Highlights {
        interface Options {
            /** An optional path to a file or folder of grammars to register. */
            includePath?: string;

            /** An optional GrammarRegistry instance. */
            registry?: any;
        }

        interface HighlightArgs {
            /**
             * The optional contents of the file. The file will
             * be read from disk if this is unspecified.
             */
            fileContents?: string;

            /** The path to the file. */
            filePath?: string;

            /**
             * An optional scope name of a grammar. The best match
             * grammar will be used if this is unspecified.
             */
            scopeName?: string;
        }

        interface GrammarsArgs {
            /**
             * the String path to the module to require grammars from.
             * If the given path is a file then the grammars folder
             * from the parent directory will be used.
             */
            modulePath: string;
        }
    }

    class Highlights {
        constructor(options?: Highlights.Options);

        /**
         * Syntax highlight the given file asynchronously.
         * @returns an HTML string. The HTML will contain one `<pre>` with one `<div>`
         * per line and each line will contain one or more `<span>` elements for the
         * tokens in the line.
         */
        highlight(args: Highlights.HighlightArgs, cb: (err?: any, escapedHtml?: string) => void): void;
        /**
         * Syntax highlight the given file synchronously.
         * @returns an HTML string. The HTML will contain one `<pre>` with one `<div>`
         * per line and each line will contain one or more `<span>` elements for the
         * tokens in the line.
         */
        highlightSync(args: Highlights.HighlightArgs): string;

        /** Require all the grammars from the grammars folder at the root of an npm module asyncronously. */
        requireGrammars(args: Highlights.GrammarsArgs, cb: (err?: any) => void): void;
        /** Require all the grammars from the grammars folder at the root of an npm module */
        requireGrammarsSync(args: Highlights.GrammarsArgs): void;

        /** Replaces spaces and `&"'<>` with corresponding HTML entities. */
        escapeString(str: string): string;
    }

    export = Highlights;
}
