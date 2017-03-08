/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import tsdoc, { IJsDocTags } from "ts-quick-docs";
import { Documentalist, IBlock } from "..";
import { IFile, IPlugin } from "./plugin";

export interface ITsDocEntry {
    documentation: IBlock;
    fileName: string;
    name: string;
    tags: IJsDocTags;
    type: string;
}

export interface ITsPropertyEntry extends ITsDocEntry {
    optional?: boolean;
}

export interface ITsInterfaceEntry extends ITsDocEntry {
    extends?: string[];
    properties: ITsPropertyEntry[];
}

export interface ITsPluginData {
    ts: {
        [name: string]: ITsInterfaceEntry;
    };
}

export class TypescriptPlugin implements IPlugin<ITsPluginData> {
    public compile(documentalist: Documentalist<ITsPluginData>, files: IFile[]) {
        const entries = tsdoc.fromFiles(files.map((f) => f.path), {}).map<ITsInterfaceEntry>((entry) => ({
            ...entry,
            documentation: documentalist.renderBlock(entry.documentation),
            properties: entry.properties!.map<ITsPropertyEntry>((prop) => ({
                ...prop,
                documentation: documentalist.renderBlock(prop.documentation),
            })),
        }));
        const ts = documentalist.objectify(entries, (e) => e.name);
        return { ts };
    }
}
