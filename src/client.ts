import { IPageData } from "./page";
import { ITreeNode } from "./plugins/markdown";
import { IInterfaceEntry } from "./plugins/typescript";

// explicitly export all the interfaces
export { IBlock } from "./";
export { IMetadata, IPageData } from "./page";
export { ICss, IDeclaration, IRule } from "./plugins/css";
export { ITreeEntry, ITreeNode } from "./plugins/markdown";
export { IPlugin } from "./plugins/plugin";
export { IDocEntry, IInterfaceEntry, IPropertyEntry } from "./plugins/typescript";

export interface IMarkdownDocs {
    layout: ITreeNode[];
    pages: { [key: string]: IPageData };
}

export interface IDocumentalistData {
    docs: IMarkdownDocs;
    ts: IInterfaceEntry[];
}
