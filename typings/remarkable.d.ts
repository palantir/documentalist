declare module "remarkable" {
    namespace Remarkable {
        interface Options {
            /**
             * Enable HTML tags in source
             * @default false
             */
            html?: boolean;

            /**
             * Use '/' to close single tags (`<br />`)
             * @default false
             */
            xhtmlOut?: boolean;

            /**
             * Convert '\n' in paragraphs into `<br>`
             * @default false
             */
            breaks?: boolean;

            /**
             * CSS language prefix for fenced blocks
             * @default "language-"
             */
            langPrefix?: string;

            /**
             * Autoconvert URL-like text to links
             * @default false
             */
            linkify?: boolean;

            /**
             * Enable some language-neutral replacement + quotes beautification.
             * @default false
             */
            typographer?: boolean,

            /**
             * Double + single quotes replacement pairs, when `typographer` enabled,
             * and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
             */
            quotes?: '“”‘’',

            /**
             * Highlighter function. Return escaped HTML,
             * or empty string if the source is not changed.
             */
            highlight?: (source: string, language?: string) => string;
        }

        interface Plugin<T> {
            (md: Remarkable, options?: T): void;
        }

        interface RendererRule {
            /**
             * @param tokens  the list of tokens currently being processed
             * @param idx     the index of the token currently being processed
             * @param options the options given to remarkable
             * @param env     the key-value store created by the parsing rules
             * @returns HTML code
             */
            (tokens: any[], idx: number, options: any, env: any): string;
        }

        interface Renderer {
            rules: { [name: string]: RendererRule };
        }

        interface Ruler {
            enable(rules: string[]): void;
            disable(rules: string[]): void;

            /** inserts a new rule before the rule beforeName. */
            before(beforeName: string, ruleName: string, fn: Function, options: any): void;

            /** inserts a new rule after the rule afterName. */
            after(afterName: string, ruleName: string, fn: Function, options: any): void;

            /** inserts a new rule at the end of the rule list. */
            push(ruleName: string, fn: Function, options: any): void;

            /** replace the rule ruleName with a new rule. */
            at(ruleName: string, fn: Function, options: any): void;
        }

        interface Parser {
            ruler: Ruler;
        }
    }

    class Remarkable {
        block: Remarkable.Parser;
        core: Remarkable.Parser;
        inline: Remarkable.Parser;

        renderer: Remarkable.Renderer;

        constructor(options?: Remarkable.Options);
        constructor(preset: "commonmark" | "full", options?: Remarkable.Options);

        render(markdown: string): string;

        set(options: Remarkable.Options): void;

        use<T>(plugin: Remarkable.Plugin<T>, pluginOptions?: T): void;
    }

    export = Remarkable;
}
