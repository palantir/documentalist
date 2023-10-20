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

import { dirname } from "node:path";
import type { ICompiler, IFile, IPlugin, ITypescriptPluginData } from "@documentalist/client";
import { tsconfigResolverSync } from "tsconfig-resolver";
import { Application, LogLevel, TSConfigReader, TypeDocOptions, TypeDocReader } from "typedoc";
import { Visitor } from "./visitor";

export interface ITypescriptPluginOptions {
    /**
     * List of entry point modules.
     * @default ["src/index.ts"]
     */
    entryPoints?: TypeDocOptions["entryPoints"];

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
    private app: Application | undefined;

    private typedocOptions: Partial<TypeDocOptions>;

    /** Resolves when the project application has been initialized & bootstrapped succesfully. */
    private projectInit: Promise<void>;

    public constructor(private options: ITypescriptPluginOptions = {}) {
        const {
            entryPoints = ["src/index.ts"],
            includeDeclarations = false,
            includeNodeModules = false,
            includePrivateMembers = false,
            tsconfigPath = this.getDefaultTsconfigPath(entryPoints[0]),
            verbose = false,
        } = options;

        this.typedocOptions = {
            commentStyle: "jsdoc",
            entryPointStrategy: "expand",
            entryPoints,
            exclude: [
                includeNodeModules ? undefined : "**/node_modules/**",
                includeDeclarations ? undefined : "**/*.d.ts",
            ].filter(Boolean) as string[],
            excludePrivate: !includePrivateMembers,
            gitRevision: options.gitBranch,
            logLevel: verbose ? LogLevel.Verbose : LogLevel.Error,
            skipErrorChecking: false,
            tsconfig: tsconfigPath,
        };
        this.projectInit = this.initializeTypedoc();
    }

    private async initializeTypedoc() {
        // Support reading tsconfig.json + typedoc.json
        this.app = await Application.bootstrapWithPlugins(this.typedocOptions, [
            new TypeDocReader(),
            new TSConfigReader(),
        ]);
        return;
    }

    public async compile(files: IFile[], compiler: ICompiler): Promise<ITypescriptPluginData> {
        const project = await this.getTypedocProject(files.map((f) => f.path));
        const visitor = new Visitor(compiler, this.options);

        if (project === undefined) {
            return { typescript: {} };
        }

        const typescript = compiler.objectify(visitor.visitProject(project), (i) => i.name);
        return { typescript };
    }

    private async getTypedocProject(files: string[]) {
        await this.projectInit;

        if (this.app === undefined) {
            return undefined;
        }

        this.app.options.setValue("entryPoints", files);
        return this.app.convert();
    }

    /**
     * @throws if no tsconfig.json found or it has invalid syntax
     */
    private getDefaultTsconfigPath(firstEntryPoint: string): string | undefined {
        console.info(`[Documentalist] Path to tsconfig.json not provided, attempting to resolve from first entry point at '${firstEntryPoint}'`);
        const { path, reason } = tsconfigResolverSync({ cwd: dirname(firstEntryPoint) });
        switch (reason) {
            case "not-found":
                throw new Error(`[Documentalist] Failed to locate tsconfig.json.`);
            case "invalid-config":
                throw new Error(`[Documentalist] Found invalid tsconfig.json at location: ${path}`);
            default:
                return path;
        }
    }
}
