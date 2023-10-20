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

import type { ICompiler, IFile, IPlugin, ITypescriptPluginData, TypeScriptDocEntry } from "@documentalist/client";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { tsconfigResolverSync } from "tsconfig-resolver";
import { Application, LogLevel, TSConfigReader, TypeDocOptions, TypeDocReader } from "typedoc";
import { load as loadMissingExports } from "typedoc-plugin-missing-exports";
import * as ts from "typescript";
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
    private hasLoadedMissingExportsPlugin = false;

    private typedocOptions: Partial<TypeDocOptions>;

    /*
     * Maps of tsconfig.json paths to their TS programs and TypeDoc apps, respectively.
     *
     * These are necesary to support compilation of a list of files which may belong to separate TypeScript projects,
     * a situation which occurs frequently in a monorepo.
     */
    private tsPrograms: Map<string, ts.Program> = new Map();
    private typedocApps: Map<string, Application> = new Map();

    public constructor(private options: ITypescriptPluginOptions = {}) {
        const {
            entryPoints = ["src/index.ts"],
            includeDeclarations = false,
            includeNodeModules = false,
            includePrivateMembers = false,
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
        };
    }

    private async initializeTypedocAppAndTsProgram(tsconfig: string, entryPoints: string[]) {
        const options = {
            ...this.typedocOptions,
            entryPoints,
            tsconfig,
        };
        const app = await Application.bootstrapWithPlugins(options, [new TypeDocReader(), new TSConfigReader()]);

        if (!this.hasLoadedMissingExportsPlugin) {
            // this plugin can only be loaded once, for some reason, even though we have multiple Applications
            loadMissingExports(app);
            this.hasLoadedMissingExportsPlugin = true;
        }

        this.typedocApps.set(tsconfig, app);

        const { config } = ts.readConfigFile(tsconfig, (path) => readFileSync(path, { encoding: "utf-8" }));
        const program = ts.createProgram(entryPoints, config);
        this.tsPrograms.set(tsconfig, program);

        return app;
    }

    public async compile(files: IFile[], compiler: ICompiler): Promise<ITypescriptPluginData> {
        // List of existing projects which contain some of the files to compile
        const existingProjectsToCompile: string[] = [];

        // Map of (tsconfig path -> list of files to compile)
        const newProjectsToCreate: Record<string, string[]> = {};

        for (const file of files) {
            let hasExistingProject = false;

            // attempt to load an existing project which contains this file
            for (const [tsconfigPath, program] of this.tsPrograms.entries()) {
                if (program.getRootFileNames().includes(file.path)) {
                    existingProjectsToCompile.push(tsconfigPath);
                    hasExistingProject = true;
                }
            }

            // if we don't have one, keep track of it in the new projects we must create
            if (!hasExistingProject) {
                const tsconfigPath = this.resolveClosestTsconfig(file);
                if (tsconfigPath !== undefined) {
                    if (newProjectsToCreate[tsconfigPath] !== undefined) {
                        newProjectsToCreate[tsconfigPath].push(file.path);
                    } else {
                        newProjectsToCreate[tsconfigPath] = [file.path];
                    }
                }
            }
        }

        const output: Record<string, TypeScriptDocEntry> = {};

        for (const projectPath of existingProjectsToCompile) {
            const app = this.typedocApps.get(projectPath);
            if (app === undefined) {
                throw new Error(`[Documentalist] could not find TypeDoc application for project at ${projectPath}`);
            }

            const docs = await this.getDocumentationOutput(compiler, app);
            for (const [key, value] of Object.entries(docs)) {
                output[key] = value;
            }
        }

        for (const [projectPath, files] of Object.entries(newProjectsToCreate)) {
            const app = await this.initializeTypedocAppAndTsProgram(projectPath, files);
            const docs = await this.getDocumentationOutput(compiler, app);
            for (const [key, value] of Object.entries(docs)) {
                output[key] = value;
            }
        }

        return { typescript: output };
    }

    private async getDocumentationOutput(compiler: ICompiler, app: Application) {
        const visitor = new Visitor(compiler, this.options);
        const project = await app.convert();
        if (project === undefined) {
            throw new Error(
                `[Documentalist] unable to generate typescript documentation for project at ${app.options.getValue(
                    "tsconfig",
                )}`,
            );
        }

        return compiler.objectify(visitor.visitProject(project), (i) => i.name);
    }

    private resolveClosestTsconfig(file: IFile) {
        const { path, reason } = tsconfigResolverSync({ cwd: dirname(file.path) });

        switch (reason) {
            case "invalid-config":
                console.error(
                    `[Documentalist] invalid tsconfig resolved for ${file.path}, skipping documentation of this file`,
                );
                return undefined;
            case "not-found":
                console.error(
                    `[Documentalist] unable to find any relevant tsconfig for ${file.path}, skipping documentation of this file`,
                );
                return undefined;
            default:
                return path;
        }
    }
}
