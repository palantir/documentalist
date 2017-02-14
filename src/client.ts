import { IDocEntry } from "ts-quick-docs/dist/interfaces";
import { DocPage, TreeDict } from "./";

export interface IDocumentalistData {
    layout: TreeDict;
    pages: { [key: string]: DocPage };
    entities: IDocEntry[];
}
