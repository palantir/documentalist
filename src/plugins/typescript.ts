/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import tsdoc, { IJsDocTags } from "ts-quick-docs";
import { Documentalist, IBlock } from "..";
import { IFile, IPlugin } from "./plugin";

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
    properties: IPropertyEntry[];
}

export class TypescriptPlugin implements IPlugin<IInterfaceEntry[]> {
    public name = "ts";

    public compile(documentalist: Documentalist, files: IFile[]) {
        return tsdoc.fromFiles(files.map((f) => f.path), {}).map<IInterfaceEntry>((entry) => ({
            ...entry,
            documentation: documentalist.renderBlock(entry.documentation),
            properties: entry.properties!.map<IPropertyEntry>((prop) => ({
                ...prop,
                documentation: documentalist.renderBlock(prop.documentation),
            })),
        }));
    }
}
