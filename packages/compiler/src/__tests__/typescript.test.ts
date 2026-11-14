/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isTsClass, isTsInterface, TypescriptPluginData } from "@documentalist/client";
import { promises as fs } from "fs";
import { join } from "path";
import { Documentalist } from "../documentalist";
import { TypescriptPlugin, TypescriptPluginOptions } from "../plugins/typescript/typescriptPlugin";

describe("TypescriptPlugin", () => {
    it("classes snapshot", () => expectSnapshot("classes"));
    it("enums snapshot", () => expectSnapshot("enums"));
    it("interfaces snapshot", () => expectSnapshot("interfaces"));
    it("functions snapshot", () => expectSnapshot("functions"));

    it("preserves markdown whitespace around code in property comments", async () => {
        const fixtureDirectory = await fs.mkdtemp("src/__tests__/__fixtures__/markdown-");
        const fixtureFilepath = join(fixtureDirectory, "example.ts");
        try {
            await fs.copyFile("src/__tests__/__fixtures__/tsconfig.json", join(fixtureDirectory, "tsconfig.json"));
            await fs.writeFile(
                fixtureFilepath,
                [
                    "export interface MarkdownComments {",
                    "    /**",
                    "     * Props for the [input component](#input).",
                    "     *",
                    "     * Some properties are unavailable:",
                    "     * - `inputProps.value`: use `query` instead",
                    "     * - `inputProps.disabled`: use `disabled` instead",
                    "     *",
                    "     * Other notes:",
                    "     * - `inputProps.tagName` overrides `popoverProps.targetTagName`.",
                    "     */",
                    "    inputProps?: object;",
                    "",
                    "    /**",
                    "     * Example using `value`:",
                    "     *",
                    "     * ```ts",
                    '     * const value = "example";',
                    "     * ```",
                    "     *",
                    "     * Return `value` unchanged.",
                    "     */",
                    "    example?: string;",
                    "}",
                ].join("\n"),
            );
            const dm = Documentalist.create().use(
                ".ts",
                new TypescriptPlugin({
                    entryPoints: [fixtureFilepath],
                    tsconfigPath: join(fixtureDirectory, "tsconfig.json"),
                }),
            );
            const { typescript } = await dm.documentGlobs(fixtureFilepath);
            const { MarkdownComments } = typescript;
            if (!isTsInterface(MarkdownComments)) {
                throw new Error("Expected MarkdownComments interface");
            }
            const inputProps = MarkdownComments.properties.find(prop => prop.name === "inputProps")!;
            expect(inputProps.documentation?.contentsRaw).toBe(
                "Props for the [input component](#input).\n\n" +
                    "Some properties are unavailable:\n" +
                    "- `inputProps.value`: use `query` instead\n" +
                    "- `inputProps.disabled`: use `disabled` instead\n\n" +
                    "Other notes:\n" +
                    "- `inputProps.tagName` overrides `popoverProps.targetTagName`.",
            );
            expect(inputProps.documentation?.contents).toEqual([
                '<p>Props for the <a href="#input">input component</a>.</p>\n' +
                    "<p>Some properties are unavailable:</p>\n<ul>\n" +
                    "<li><code>inputProps.value</code>: use <code>query</code> instead</li>\n" +
                    "<li><code>inputProps.disabled</code>: use <code>disabled</code> instead</li>\n</ul>\n" +
                    "<p>Other notes:</p>\n<ul>\n" +
                    "<li><code>inputProps.tagName</code> overrides <code>popoverProps.targetTagName</code>.</li>\n</ul>\n",
            ]);
            const example = MarkdownComments.properties.find(prop => prop.name === "example")!;
            expect(example.documentation?.contentsRaw).toBe(
                'Example using `value`:\n\n```ts\nconst value = "example";\n```\n\nReturn `value` unchanged.',
            );
        } finally {
            await fs.rm(fixtureDirectory, { recursive: true, force: true });
        }
    });

    describe("options", () => {
        it("excludePaths", () => {
            // this snapshot is empty: everything is excluded.
            expectSnapshot("classes", { excludePaths: ["__fixtures__/"] });
        });

        it("excludeNames", () => {
            // get ButtonProps properties; should be missing a few.
            expectSnapshot(
                "interfaces",
                { excludeNames: [/icon/i, "intent"] },
                ({ ButtonProps }) => isTsInterface(ButtonProps) && ButtonProps.properties.map(p => p.name),
            );
        });

        it("includePrivateMembers", () => {
            // class Animal has a private method
            expectSnapshot(
                "classes",
                { includePrivateMembers: true },
                ({ Animal }) => isTsClass(Animal) && Animal.methods.map(m => m.name),
            );
        });
    });
});

async function expectSnapshot(
    /** name of fixture file to feed into DM */
    name: string,
    options?: TypescriptPluginOptions,
    /** a function to transform the DM data, to avoid snapshotting _everything_. defaults to identity function. */
    transform: (data: TypescriptPluginData["typescript"]) => any = arg => arg,
) {
    const fixtureFilepath = `src/__tests__/__fixtures__/${name}.ts`;
    const dm = Documentalist.create().use(
        ".ts",
        new TypescriptPlugin({
            ...options,
            entryPoints: [fixtureFilepath],
            gitBranch: "develop",
            tsconfigPath: "src/__tests__/__fixtures__/tsconfig.json",
        }),
    );
    const { typescript } = await dm.documentGlobs(fixtureFilepath);
    expect(transform(typescript)).toMatchSnapshot();
}
