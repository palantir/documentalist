/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Documentalist } from "../documentalist";
import { IFile } from "../plugins/index";
import { TypedocPlugin } from "../plugins/typedoc";

const FILES: IFile[] = [{ path: "src/__tests__/fakes/button.ts", read: () => "" }];

describe("TypescriptPlugin", () => {
    const dm = Documentalist.create().use(".ts", new TypedocPlugin());

    it("snapshot", async () => {
        const { typedoc } = await dm.documentFiles(FILES);
        expect(typedoc).toMatchSnapshot();
    });
});
