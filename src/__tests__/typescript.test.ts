/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { isTsClass, isTsInterface, ITypescriptPluginData } from "../client/typescript";
import { Documentalist } from "../documentalist";
import { ITypescriptPluginOptions, TypescriptPlugin } from "../plugins/typescript/index";

describe("TypescriptPlugin", () => {
    it("classes snapshot", () => expectSnapshot("classes"));
    it("interfaces snapshot", () => expectSnapshot("interfaces"));

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
