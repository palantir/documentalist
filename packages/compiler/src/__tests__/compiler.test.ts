/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { isHeadingTag } from "@documentalist/client";
import { Compiler } from "../compiler";

describe("Compiler", () => {
    const API = new Compiler({});

    describe("objectify", () => {
        it("empty array returns empty object", () => {
            expect(API.objectify([], x => x)).toEqual({});
        });

        it("turns an array into an object", () => {
            const array = [{ name: "Bill", age: 1037 }, { name: "Gilad", age: 456 }, { name: "Robert", age: 21 }];
            const byName = API.objectify(array, x => x.name);
            expect(Object.keys(byName)).toEqual(["Bill", "Gilad", "Robert"]);
        });
    });

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
        it("returns a single-element array for string without @tags", () => {
            const { contents } = API.renderBlock("simple string");
            expect(contents).toEqual(["<p>simple string</p>\n"]);
        });

        it("converts @tag to object in array", () => {
            const { contents } = API.renderBlock(FILE);
            expect(contents).toHaveLength(3);
            expect(contents[1]).toEqual({ tag: "interface", value: "IButtonProps" });
        });

        it("converts @#+ to heading tags in array", () => {
            const { contents } = API.renderBlock(HEADING_FILE);
            expect(contents).toHaveLength(9);
            const headings = contents.filter(isHeadingTag);
            expect(headings).toHaveLength(4);
            // choosing one to test deep equality
            expect(headings[1]).toEqual({
                level: 2,
                route: "",
                tag: "heading",
                value: "Section 1",
            });
        });

        it("reservedWords will ignore matching @tag", () => {
            const { contents } = API.renderBlock(FILE, ["interface"]);
            // only one string (reserved @word does not get split to its own entry)
            expect(contents).toHaveLength(1);
            // @tag value comes out exactly as written in source, on its own line
            expect((contents[0] as string).split("\n")).toContain("@interface IButtonProps");
        });
    });
});

const FILE = `
# Title
description
@interface IButtonProps
more description
`;

const HEADING_FILE = `
@# Title
description
@## Section 1
@interface IButtonProps
more words
@### Section 1a
more words
@## Section 2
more words
`;
