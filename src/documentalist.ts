/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import { IFile, IPlugin } from "./client";
import { Compiler, ICompilerOptions } from "./compiler";

/**
 * Plugins are stored with the regex used to match against file paths.
 */
export interface IPluginEntry<T> {
    pattern: RegExp;
    plugin: IPlugin<T>;
}

export class Documentalist<T> {
    /**
     * Construct a new `Documentalist` instance with the provided options.
     * This method lends itself particularly well to the chaining syntax:
     * `Documentalist.create(options).use(...)`.
     */
    public static create(options?: ICompilerOptions): Documentalist<{}> {
        return new Documentalist(options, []);
    }

    constructor(private options: ICompilerOptions = {}, private plugins: Array<IPluginEntry<T>> = []) {}

    /**
     * Adds the plugin to Documentalist. Returns a new instance of Documentalist
     * with a template type that includes the data from the plugin. This way the
     * `documentFiles` and `documentGlobs` methods will return an object that is
     * already typed to include each plugin's output.
     *
     * The plugin is applied to all files whose absolute path matches the
     * supplied pattern.
     *
     * @param pattern - A regexp pattern or a file extension string like "js"
     * @param plugin - The plugin implementation
     * @returns A new instance of `Documentalist` with an extended type
     */
    public use<P>(pattern: RegExp | string, plugin: IPlugin<P>): Documentalist<T & P> {
        if (typeof pattern === "string") {
            pattern = new RegExp(`${pattern}$`);
        }

        const newPlugins = [...this.plugins, { pattern, plugin }] as Array<IPluginEntry<T & P>>;
        return new Documentalist(this.options, newPlugins);
    }

    /**
     * Returns a new instance of Documentalist with no plugins.
     */
    public clearPlugins(): Documentalist<{}> {
        return new Documentalist<{}>(this.options, []);
    }

    /**
     * Finds all files matching the provided variadic glob expressions and then
     * runs `documentFiles` with them, emitting all the documentation data.
     */
    public async documentGlobs(...filesGlobs: string[]) {
        const files = this.expandGlobs(filesGlobs);
        return this.documentFiles(files);
    }

    /**
     * Iterates over all plugins, passing all matching files to each in turn.
     * The output of each plugin is merged to produce the resulting
     * documentation object.
     *
     * The return type `T` is a union of each plugin's data type.
     */
    public async documentFiles(files: IFile[]) {
        const compiler = new Compiler(this.options);
        // need an empty object of correct type that we can merge into
        // tslint:disable-next-line:no-object-literal-type-assertion
        const documentation = {} as T;
        for (const { pattern, plugin } of this.plugins) {
            const pluginFiles = files.filter(f => pattern.test(f.path));
            const pluginDocumentation = await plugin.compile(pluginFiles, compiler);
            this.mergeInto(documentation, pluginDocumentation);
        }
        return documentation;
    }

    /**
     * Expands an array of globs and flatten to a single array of files.
     */
    private expandGlobs(filesGlobs: string[]): IFile[] {
        return filesGlobs
            .map(filesGlob => glob.sync(filesGlob))
            .reduce((a, b) => a.concat(b))
            .map(fileName => {
                const absolutePath = path.resolve(fileName);
                return {
                    path: absolutePath,
                    read: () => fs.readFileSync(absolutePath, "utf8"),
                };
            });
    }

    /**
     * Shallow-merges keys form source into destination object (modifying it in the process).
     */
    private mergeInto(destination: T, source: T) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (destination.hasOwnProperty(key)) {
                    console.warn(`WARNING: Duplicate plugin key "${key}". Your plugins are overwriting each other.`);
                }
                destination[key] = source[key];
            }
        }
        return destination;
    }
}
