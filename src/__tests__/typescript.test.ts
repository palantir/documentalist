/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Documentalist } from "../documentalist";
import { TypescriptPlugin } from "../plugins/typescript/index";

describe("TypescriptPlugin", () => {
    const dm = Documentalist.create().use(".ts", new TypescriptPlugin());

    snapshot("classes");
    snapshot("interfaces");

    function snapshot(name: string) {
        it(`${name} snapshot`, async () => {
            const { typescript } = await dm.documentGlobs(`src/__tests__/__fixtures__/${name}.ts`);
            expect(typescript).toMatchSnapshot();
        });
    }
});
