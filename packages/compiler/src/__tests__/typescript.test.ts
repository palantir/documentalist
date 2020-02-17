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

import { isTsClass, isTsInterface, ITypescriptPluginData } from "@documentalist/client";
import { Documentalist } from "../documentalist";
import { ITypescriptPluginOptions, TypescriptPlugin } from "../plugins/typescript/index";

describe("TypescriptPlugin", () => {
    it("classes snapshot", () => expectSnapshot("classes"));
    it("enums snapshot", () => expectSnapshot("enums"));
    it("interfaces snapshot", () => expectSnapshot("interfaces"));
    it("functions snapshot", () => expectSnapshot("functions"));

    describe("options", () => {
        it("excludePaths", () => {
            // this snapshot is empty: everything is excluded.
            expectSnapshot("classes", { excludePaths: ["__fixtures__/"] });
        });

        it("excludeNames", () => {
            // get IButtonProps properties; should be missing a few.
            expectSnapshot(
                "interfaces",
                { excludeNames: [/icon/i, "intent"] },
                ({ IButtonProps }) => isTsInterface(IButtonProps) && IButtonProps.properties.map(p => p.name),
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

        it("includeNonExportedMembers", () => {
            // expect to see Animal (exported) and Food (not exported) here
            expectSnapshot("classes", { includeNonExportedMembers: true }, Object.keys);
            // expect to see both functions here
            expectSnapshot("functions", { includeNonExportedMembers: true });
        });
    });
});

async function expectSnapshot(
    /** name of fixture file to feed into DM */
    name: string,
    options?: ITypescriptPluginOptions,
    /** a function to transform the DM data, to avoid snapshotting _everything_. defaults to identity function. */
    transform: (data: ITypescriptPluginData["typescript"]) => any = arg => arg,
) {
    const dm = Documentalist.create().use(".ts", new TypescriptPlugin({ ...options, gitBranch: "develop" }));
    const { typescript } = await dm.documentGlobs(`src/__tests__/__fixtures__/${name}.ts`);
    expect(transform(typescript)).toMatchSnapshot();
}
