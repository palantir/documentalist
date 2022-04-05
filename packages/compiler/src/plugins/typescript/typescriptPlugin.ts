/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ICompiler, IFile, IPlugin, ITypescriptPluginData } from "@documentalist/client";
import { Application, TSConfigReader, TypeDocOptions, TypeDocReader } from "typedoc";
import { Visitor } from "./visitor";

export interface ITypescriptPluginOptions {
    /**
     * TODO(adahiya): will be used in TypeDoc v0.22.0+
     * List of entry point modules.
     * @default ["src/index.ts"]
     */
    // entryPoints?: TypeDocOptions["entryPoints"];

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
     * Whether files in `node_modules` should be included in the TypeScript
     * compilation context. This is disabled by default because it typically
     * results in an explosion of data size due to including all types from _all
     * installed packages_, the vast majority of which are not useful for
     * documenting your own APIs.
     *
     * Enable at your own risk, and consider using the `excludeNames` and
     * `excludePaths` options above to filter the output data.
     * @default false
     */
    includeNodeModules?: boolean;

    /**
     * Whether `private` fields should be included in the data.
     * This is disabled by default as `private` fields typically do not need to be publicly documented.
     * @default false
     */
    includePrivateMembers?: boolean;

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
    private app = new Application();

    public constructor(private options: ITypescriptPluginOptions = {}) {
        const { includeDeclarations = false, includePrivateMembers = false, tsconfigPath, verbose = false } = options;
        const typedocOptions: Partial<TypeDocOptions> = {
            // TODO(adahiya): will be used in TypeDoc v0.22+
            // entryPointStrategy: "expand",
            // entryPoints: options.entryPoints ?? ["src/index.ts"],
            exclude: options.includeNodeModules ? [] : ["**/node_modules/**"],
            excludePrivate: !includePrivateMembers,
            gitRevision: options.gitBranch,
            ignoreCompilerErrors: true,
            includeDeclarations,
            // tslint:disable-next-line no-console
            logger: verbose ? console.log : "none",
            tsconfig: tsconfigPath,
        };
        // Support reading tsconfig.json + typedoc.json
        this.app.options.addReader(new TypeDocReader());
        this.app.options.addReader(new TSConfigReader());
        this.app.bootstrap(typedocOptions);
    }

    public compile(files: IFile[], compiler: ICompiler): ITypescriptPluginData {
        const project = this.getTypedocProject(files.map((f) => f.path));
        const visitor = new Visitor(compiler, this.options);

        if (project === undefined) {
            return { typescript: {} };
        }

        const typescript = compiler.objectify(visitor.visitProject(project), (i) => i.name);
        return { typescript };
    }

    private getTypedocProject(files: string[]) {
        // TODO(adahiya): will be used in TypeDoc v0.22+
        // const entryPoints = this.app.getEntryPointsForPaths(files);
        // this.app.options.setValue("entryPoints", files);
        const expanded = this.app.expandInputFiles(files);
        return this.app.convert(expanded);
    }
}