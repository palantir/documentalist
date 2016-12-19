import * as assert from "assert";
import "mocha";
import { extractMetadata, namespaceify } from "../src/utils";

describe("extractMetadata", () => {
    const METADATA = "---\nhello: world\nsize: 1000\n---\n";
    const MARKDOWN = "# Title\nbody body body";
    const OBJECT = { hello: "world", size: 1000 };

    it("extracts contents and parses metadata", () => {
        const data = extractMetadata(METADATA + MARKDOWN);
        assert.strictEqual(data.contents, MARKDOWN);
        assert.deepEqual(data.metadata, OBJECT);
    });

    it("supports empty metadata block", () => {
        const data = extractMetadata("---\n---\n" + MARKDOWN);
        assert.strictEqual(data.contents, MARKDOWN);
        assert.deepEqual(data.metadata, {});
    });

    it("metadata block is optional", () => {
        const data = extractMetadata(MARKDOWN);
        assert.strictEqual(data.contents, MARKDOWN);
        assert.deepEqual(data.metadata, {});
    });
});

describe("namespaceify", () => {
    it("builds a nested object", () => {
        assert.deepEqual(
            namespaceify(["a", "b", "c"]),
            { a: { b: { c: {} } } },
        );
    });

    it("can add to existing root", () => {
        const root = { a: { d: {} }, x: { y: {} } };
        assert.deepEqual(
            namespaceify(["a", "b", "c"], root),
            {
                a: {
                    b: { c: {} },
                    d: {},
                },
                x: { y: {} },
            },
        );
    })
});
