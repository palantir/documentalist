/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Documentalist, ITag } from "../index";
import { MarkdownPlugin } from "../plugins/markdown";

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
        path : "/whatever/other/test.md",
        read : () => TEST_MARKDOWN,
    }, {
        path : "/who/cares/_nav.md",
        read : () => TEST_NAV,
    },
];

describe("Plugins", () => {
    const dm = Documentalist.create()
        .use(".md", new MarkdownPlugin());

    it("can document Markdown files", async () => {
        const docs = await dm.documentFiles(TEST_FILES);
        const page = docs.pages["test"];
        expect(page).toBeDefined();
        expect(page.metadata["key"]).toBe("value");
        expect(page.contents).toHaveLength(3);
        expect((page.contents[2] as ITag).tag).toBe("othertag");
    });
});
