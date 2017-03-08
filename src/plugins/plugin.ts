/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { ICompiler } from "../compiler";

export interface IFile {
    path: string;
    read: () => string;
}

export interface IPlugin<T> {
    compile: (files: IFile[], doc: ICompiler) => T | Promise<T>;
}
