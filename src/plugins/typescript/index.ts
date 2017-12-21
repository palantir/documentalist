/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Application } from "typedoc";
import { ICompiler, IFile, IPlugin, ITypescriptPluginData } from "../../client";
import { Visitor } from "./visitor";

export { ITypescriptPluginData };

export interface ITypescriptPluginOptions {
    /**
     * Array of glob strings to exclude entire files. Files in `node_modules/` are always excluded.
     * Note that when matching directories you'll need to capture the entire path using `**`s on either end.
     */
    excludePaths?: string[];

    /** Array of patterns (string or RegExp) to exclude named members. */
    excludeNames?: Array<string | RegExp>;

    /**
     * Enable parsing of `.d.ts` files.
     * @default false
     */
    includeDeclarations?: boolean;

    /**
     * Whether `private` fields should be included in the data.
     * This is disabled by default as `private` fields typically do not need to be publicly documented.
     * @default false
     */
    includePrivateMembers?: boolean;

    /**
     * Whether members not marked `export` should be included in the data.
     * This is disabled by default as non-exported members typically do not need to be publicly documented.
     * @default false
     */
    includeNonExportedMembers?: boolean;
}

export class TypescriptPlugin implements IPlugin<ITypescriptPluginData> {
    private app: TypedocApp;
    public constructor(private options: ITypescriptPluginOptions = {}) {
        const { includeDeclarations = false, includePrivateMembers = false } = options;
        this.app = new TypedocApp({
            exclude: "**/node_modules/**",
            excludePrivate: !includePrivateMembers,
            ignoreCompilerErrors: true,
            includeDeclarations,
            logger: "none",
            mode: "modules",
        });
    }

    public compile(files: IFile[], compiler: ICompiler): ITypescriptPluginData {
        const project = this.getTypedocProject(files.map(f => f.path));
        const visitor = new Visitor(compiler, this.options);
        const typescript = compiler.objectify(visitor.visitProject(project), i => i.name);
        return { typescript };
    }

    private getTypedocProject(files: string[]) {
        const expanded = this.app.expandInputFiles(files);
        return this.app.convert(expanded);
    }
}

// tslint:disable-next-line:max-classes-per-file
class TypedocApp extends Application {
    // this tricks typedoc into working
    get isCLI() {
        return true;
    }
}
