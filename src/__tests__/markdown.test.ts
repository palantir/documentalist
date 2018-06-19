/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Documentalist } from "../documentalist";
import { MarkdownPlugin } from "../plugins/markdown";

const TEST_MARKDOWN = `---
key: value
---

@# I'm special

## I'm regular

@othertag params
`;

const TEST_NAV = `@page file
`;

const TEST_FILES = [
    {
        path: "path/to/file.md",
        read: () => TEST_MARKDOWN,
    },
    {
        path: "path/to/_nav.md",
        read: () => TEST_NAV,
    },
];

describe("MarkdownPlugin", () => {
    const dm = Documentalist.create().use(".md", new MarkdownPlugin());

    it("snapshot", async () => {
        const { pages } = await dm.documentFiles(TEST_FILES);
        expect(pages).toMatchSnapshot();
    });
});
