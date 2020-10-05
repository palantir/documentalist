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

import * as path from "path";
import { Documentalist } from "./documentalist";
import { NpmPlugin } from "./plugins/npm";
import { TypescriptPlugin } from "./plugins/typescript";

// Launch "Documentalist" from Debug panel in VS Code (see .vscode/launch.json).

// Run something for the VS Code debugger to attach to.
// Set breakpoints in original .ts source and debug in the editor!
// tslint:disable prettier
Documentalist.create()
    .use(".ts", new TypescriptPlugin())
    .use("package.json", new NpmPlugin())
    .documentGlobs(
        path.join(__dirname, "..", "package.json"),
        // compile test fixtures:
        path.join(__dirname, "__tests__", "__fixtures__", "*.ts"),
        // compile our own source code:
        // path.join(__dirname, "..", "src", "index.ts"),
    );
