import tsdoc, { IJsDocTags } from "ts-quick-docs";
import { Documentalist, IBlock } from "..";
import { IPlugin } from "./plugin";

export interface IDocEntry {
    documentation: IBlock;
    fileName: string;
    name: string;
    tags: IJsDocTags;
    type: string;
}

export interface IPropertyEntry extends IDocEntry {
    optional?: boolean;
}

export interface IInterfaceEntry extends IDocEntry {
    extends?: string[];
    properties?: IPropertyEntry[];
}

export class TypescriptPlugin implements IPlugin {
    public name = "ts";

    public compile(_documentalist: Documentalist, markdownFiles: string[]) {
        return tsdoc.fromFiles(markdownFiles, {}).map<IInterfaceEntry>((entry) => ({
            ...entry,
            documentation: _documentalist.renderBlock(entry.documentation),
            properties: entry.properties!.map<IPropertyEntry>((prop) => ({
                ...prop,
                documentation: _documentalist.renderBlock(entry.documentation),
            })),
        }));
    }
}
