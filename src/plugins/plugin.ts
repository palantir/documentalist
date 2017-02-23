/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Documentalist } from "..";

export interface IPlugin {
    name: string;

    compile: (doc: Documentalist, files: string[]) => any;
}
