import { DocPage, TreeDict } from "./plugins/markdown";

export * from "./plugins/css";
export * from "./plugins/markdown";
export * from "./plugins/plugin";
export * from "./plugins/typescript";

export interface IMarkdownDocs {
    layout: TreeDict;
    pages: { [key: string]: DocPage };
}

export interface IDocumentalistData {
    docs: IMarkdownDocs;
    ts: any[];
}
