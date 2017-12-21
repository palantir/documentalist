/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { ICompiler } from "./compiler";

/**
 * A Documentalist plugin is an object with a `compile(files, compiler)` function
 * that returns a data object (or a promise for that object).
 *
 * A common pattern is to define a class that implements this interface and use the constructor
 * to accept options.
 *
 * ```ts
 * import { ICompiler, IFile, IPlugin } from "documentalist/client";
 *
 * export interface MyData {
 *     pluginName: { ... }
 * }
 *
 * export interface MyOptions {
 *     ...
 * }
 *
 * export class MyPlugin implements IPlugin<MyData> {
 *     public constructor(options: MyOptions = {}) {}
 *
 *     public compile(files: IFile[], compiler: ICompiler) {
 *         return files.map(transformToMyData);
 *     }
 * }
 * ```
 */
export interface IPlugin<T> {
    compile(files: IFile[], compiler: ICompiler): T | Promise<T>;
}

/**
 * Abstract representation of a file, containing absolute path and synchronous `read` operation.
 * This allows plugins to use only the path of a file without reading it.
 */
export interface IFile {
    path: string;
    read(): string;
}
