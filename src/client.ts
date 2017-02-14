import { IDocEntry } from "ts-quick-docs/dist/interfaces";
import { DocPage, TreeDict } from "./plugins/markdown";

export interface IMarkdownDocs {
    layout: TreeDict;
    pages: { [key: string]: DocPage };
}

export interface IDocumentalistData {
    docs: IMarkdownDocs;
    entities: IDocEntry[];
}
