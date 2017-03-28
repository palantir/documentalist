/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import tsdoc, { IDocumentationOptions, IJsDocTags } from "ts-quick-docs";
import { IBlock, ICompiler, IFile, IPlugin } from "./plugin";

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

export interface ITypescriptPluginData {
    ts: {
        [name: string]: ITsInterfaceEntry;
    };
}

export class TypescriptPlugin implements IPlugin<ITypescriptPluginData> {
    public constructor(
        /**
         * Options to `ts-quick-docs`, mostly for customizing which symbols appear in the output.
         */
        private options: IDocumentationOptions = {},

        /**
         * Compiler options for Typescript program used to "read" your typings.
         * (This is distinct from whatever options you need to build your typings.)
         * If omitted, the default compiler options are used.
         */
        // HACK: using any to avoid duplicate typings issue with ts.CompilerOptions
        private compilerOptions: any = {},
    ) {}

    public compile(files: IFile[], { renderBlock, objectify }: ICompiler) {
        const entries = tsdoc.fromFiles(files.map((f) => f.path), this.compilerOptions, this.options)
            .map<ITsInterfaceEntry>((entry) => ({
                ...entry,
                documentation: renderBlock(entry.documentation),
                properties: entry.properties!.map<ITsPropertyEntry>((prop) => ({
                    ...prop,
                    documentation: renderBlock(prop.documentation),
                })),
            }));
        const ts = objectify(entries, (e) => e.name);
        return { ts };
    }
}
