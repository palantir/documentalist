/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { assert } from "chai";
import "mocha";
import { Documentalist } from "../src";

describe("Documentalist", () => {
    const API = Documentalist.create();

    describe("metadata", () => {
        const METADATA = "---\nhello: world\nsize: 1000\n---\n";
        const MARKDOWN = "# Title\nbody body body";
        const OBJECT = { hello: "world", size: 1000 };

        it("extracts contents and parses metadata", () => {
            const data = API.renderBlock(METADATA + MARKDOWN);
            assert.strictEqual(data.content, MARKDOWN);
            assert.deepEqual(data.metadata, OBJECT);
        });

        it("supports empty metadata block", () => {
            const data = API.renderBlock("---\n---\n" + MARKDOWN);
            assert.strictEqual(data.content, MARKDOWN);
            assert.deepEqual(data.metadata, {});
        });

        it("metadata block is optional", () => {
            const data = API.renderBlock(MARKDOWN);
            assert.strictEqual(data.content, MARKDOWN);
            assert.deepEqual(data.metadata, {});
        });
    });

    describe("renderedContent", () => {
        const FILE = `
# Title
description
@interface IButtonProps
more description
        `;

        it("returns a single-element array for string without @tags", () => {
            const { renderedContent } = API.renderBlock("simple string");
            assert.deepEqual(renderedContent, ["<p>simple string</p>\n"]);
        });

        it("converts @tag to object in array", () => {
            const { renderedContent } = API.renderBlock(FILE);
            assert.equal(renderedContent.length, 3);
            assert.deepEqual(renderedContent[1], { tag: "interface", value: "IButtonProps" });
        });

        it("reservedWords will ignore matching @tag", () => {
            const { renderedContent } = API.renderBlock(FILE, ["interface"]);
            assert.equal(renderedContent.length, 3);
            // reserved @tag is emitted as separate string cuz it's still split by regex
            assert.deepEqual(renderedContent[1], "<p>@interface IButtonProps</p>\n");
        });

    });
});
