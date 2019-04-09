/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

/**
 * This module exports all __client__ interfaces: Documentalist concepts that are meant to be used at runtime
 * alongside a compiled documentation data file.
 *
 * The `Documentalist` class and its plugins are only available at compile-time, but their interfaces are useful
 * when rendering the data, so they are exposed separately in this module.
 *
 * A few utility functions are also provided, including several type guards for `@tags`.
 */

export * from "./compiler";
export * from "./kss";
export * from "./markdown";
export * from "./npm";
export * from "./plugin";
export * from "./tags";
export * from "./typescript";
export * from "./utils";
