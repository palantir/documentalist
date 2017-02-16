import { IInterfaceEntry } from "ts-quick-docs";
import { Page } from "./page";
import { ITreeNode } from "./plugins/markdown";

export * from "./plugins/css";
export * from "./plugins/markdown";
export * from "./plugins/plugin";
export * from "./plugins/typescript";

export interface IMarkdownDocs {
    layout: ITreeNode[];
    pages: { [key: string]: Page };
}

export interface IDocumentalistData {
    docs: IMarkdownDocs;
    ts: IInterfaceEntry[];
}
