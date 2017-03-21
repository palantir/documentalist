/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Compiler } from "../src/compiler";

describe("Compiler", () => {
    const API = new Compiler({});

    describe("metadata", () => {
        const METADATA = "---\nhello: world\nsize: 1000\n---\n";
        const MARKDOWN = "# Title\nbody body body";
        const OBJECT = { hello: "world", size: 1000 };

        it("extracts contentsRaw and parses metadata", () => {
            const data = API.renderBlock(METADATA + MARKDOWN);
            expect(data.contentsRaw).toBe(MARKDOWN);
            expect(data.metadata).toEqual(OBJECT);
        });

        it("supports empty metadata block", () => {
            const data = API.renderBlock("---\n---\n" + MARKDOWN);
            expect(data.contentsRaw).toBe(MARKDOWN);
            expect(data.metadata).toEqual({});
        });

        it("metadata block is optional", () => {
            const data = API.renderBlock(MARKDOWN);
            expect(data.contentsRaw).toBe(MARKDOWN);
            expect(data.metadata).toEqual({});
        });
    });

    describe("rendered contents", () => {
        const FILE = `
# Title
description
@interface IButtonProps
more description
        `;

        it("returns a single-element array for string without @tags", () => {
            const { contents } = API.renderBlock("simple string");
            expect(contents).toEqual(["<p>simple string</p>\n"]);
        });

        it("converts @tag to object in array", () => {
            const { contents } = API.renderBlock(FILE);
            expect(contents).toHaveLength(3);
            expect(contents[1]).toEqual({ tag: "interface", value: "IButtonProps" });
        });

        it("reservedWords will ignore matching @tag", () => {
            const { contents } = API.renderBlock(FILE, ["interface"]);
            expect(contents).toHaveLength(3);
            // reserved @tag is emitted as separate string cuz it's still split by regex
            expect(contents[1]).toEqual("<p>@interface IButtonProps</p>\n");
        });

    });
});
