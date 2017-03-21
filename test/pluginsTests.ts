/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { expect } from "chai";
import "mocha";
import { Documentalist } from "../src";

const TEST_CSS = `
body { background: red; }

/**
 * Block of text
 *
 * @atag with params
 */
.rulename {
    font: 300px wingdings;
}
`;

const TEST_MARKDOWN = `---
key: value
---

@# I'm special

## I'm regular

@othertag params
`;

const TEST_NAV = `
@page test
`;

const TEST_FILES = [
    {
        path : "/fancy/absolute/test.css",
        read : () => TEST_CSS,
    }, {
        path : "/whatever/other/test.md",
        read : () => TEST_MARKDOWN,
    }, {
        path : "/who/cares/_nav.md",
        read : () => TEST_NAV,
    }
];

describe("Plugins", () => {
    it("can document Markdown files", async () => {
        const docs = await Documentalist.create().documentFiles(TEST_FILES);
        const page = docs.pages["test"];
        expect(page).to.exist;
        expect(page.metadata["key"]).to.equal("value");
        expect(page.contents).with.lengthOf(3);
        expect((page.contents[2] as any).tag).to.equal("othertag");
    });
});
