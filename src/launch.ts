/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as path from "path";
import { Documentalist } from "./documentalist";
import { TypescriptPlugin } from "./plugins/typescript";

// Launch "Documentalist" from Debug panel in VS Code (see .vscode/launch.json).

// Run something for the VS Code debugger to attach to.
// Set breakpoints in original .ts source and debug in the editor!
Documentalist.create()
    .use(".ts", new TypescriptPlugin())
    // compile test fixtures:
    .documentGlobs(path.join(__dirname, "__tests__", "__fixtures__", "*.ts"));

// compile our own source code:
// .documentGlobs(path.join(__dirname, "..", "src", "index.ts"))
