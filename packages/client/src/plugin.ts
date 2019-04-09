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
