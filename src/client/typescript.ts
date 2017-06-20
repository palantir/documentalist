/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { IJsDocTags } from "ts-quick-docs";
import { IBlock } from "./index";

export interface ITsDocEntry {
    documentation: IBlock;
    fileName?: string;
    name: string;
    tags?: IJsDocTags;
    type: string;
}

export interface ITsPropertyEntry extends ITsDocEntry {
    optional?: boolean;
}

export interface ITsInterfaceEntry extends ITsDocEntry {
    extends?: string[];
    properties: ITsPropertyEntry[];
}

export interface ITypescriptPluginData {
    ts: {
        [name: string]: ITsInterfaceEntry;
    };
}
