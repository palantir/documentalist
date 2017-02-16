import { DocPage, ITreeNode } from "./plugins/markdown";

export * from "./plugins/css";
export * from "./plugins/markdown";
export * from "./plugins/plugin";
export * from "./plugins/typescript";

export interface IMarkdownDocs {
    layout: ITreeNode[];
    pages: { [key: string]: DocPage };
}

export interface IDocumentalistData {
    docs: IMarkdownDocs;
    ts: any[];
}
