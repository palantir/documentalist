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
     * Array of patterns (string or RegExp) to exclude members by name.
     * Strings will be converted to regular expressions through `string.match(pattern)`.
     *
     * Note that excluded members will still be parsed by the compiler, so they can be referenced
     * by other symbols, but they will not appear in the output data.
     */
    excludeNames?: Array<string | RegExp>;

    /**
     * Array of patterns (string or RegExp) to exclude members based on file path.
     * See `excludeNames` above for usage notes.
     */
    excludePaths?: Array<string | RegExp>;

    /**
     * Specify the branch name to use when generating source file URLs.
     * If omitted, the current commit hash will be used.
     * @see ITsDocBase.url
     */
    gitBranch?: string;

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

    /** Path to tsconfig file. */
    tsconfigPath?: string;

    /**
     * If enabled, logs messages and compiler errors to the console.
     * Note that compiler errors are ignored by Typedoc so they do not affect docs generation.
     * @default false
     */
    verbose?: boolean;
}

export class TypescriptPlugin implements IPlugin<ITypescriptPluginData> {
    private app: TypedocApp;
    public constructor(private options: ITypescriptPluginOptions = {}) {
        const { includeDeclarations = false, includePrivateMembers = false, tsconfigPath, verbose = false } = options;
        // options docs: https://gist.github.com/mootari/d39895574c8deacc57d0fc04eb0d21ca#file-options-md
        const typedocOptions: any = {
            exclude: "**/node_modules/**",
            excludePrivate: !includePrivateMembers,
            gitRevision: options.gitBranch,
            ignoreCompilerErrors: true,
            includeDeclarations,
            logger: verbose ? console.log : "none",
            mode: "modules",
        };
        if (options.tsconfigPath != null) {
            // typedoc complains if given `undefined`, so only set if necessary
            typedocOptions.tsconfig = tsconfigPath;
        }
        this.app = new TypedocApp(typedocOptions);
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
