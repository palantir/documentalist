/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Application } from "typedoc";
import { ICompiler, IFile, IPlugin, ITypescriptPluginData } from "../../client";
import { Visitor } from "./visitor";

export interface ITypescriptPluginOptions {
    /** Exclude files by the given pattern when a path is provided as source. Supports standard minimatch patterns. */
    exclude?: string;

    /**
     * Whether `private` fields should be included in the data.
     * This is disabled by default as `private` fields typically do not need to be publicly documented.
     * @default false
     */
    includePrivates?: boolean;

    /**
     * Whether members not marked `export` should be included in the data.
     * This is disabled by default as non-exported members typically do not need to be publicly documented.
     * @default false
     */
    includeNonExported?: boolean;
}

export class TypescriptPlugin implements IPlugin<ITypescriptPluginData> {
    private app: TypedocApp;
    public constructor(private options: ITypescriptPluginOptions = {}) {
        const { exclude, includePrivates = false } = options;
        this.app = new TypedocApp({
            exclude,
            excludePrivate: !includePrivates,
            ignoreCompilerErrors: true,
            logger: "none",
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
