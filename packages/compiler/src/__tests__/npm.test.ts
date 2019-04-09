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

import { Documentalist } from "../documentalist";
import { NpmPlugin } from "../plugins/npm";

describe("NpmPlugin", () => {
    const dm = Documentalist.create().use("package.json", new NpmPlugin());

    it("npm info matches package.json", async () => {
        const { npm } = await dm.documentGlobs("package.json");
        const compilerPackageInfo = npm["@documentalist/compiler"];
        const pkg = require("../../package.json");
        // NOTE: not using snapshot as it would change with every release due to `npm info` call.
        expect(compilerPackageInfo.name).toBe(pkg.name);
        expect(compilerPackageInfo.description).toBe(pkg.description);
        expect(compilerPackageInfo.version).toBe(pkg.version);
        // HACKHACK: skipping because the renamed package has not been published yet
        // expect(compilerPackageInfo.latestVersion).toBeDefined(); // npm-info succeeded
    });

    it("handles npm info fails", async () => {
        const {
            npm: { doesNotExist },
        } = await dm.documentFiles([
            { path: "package.json", read: () => `{ "name": "doesNotExist", "version": "1.0.0" }` },
        ]);
        expect(doesNotExist.name).toBe("doesNotExist");
        expect(doesNotExist.version).toBe("1.0.0");
        expect(doesNotExist.published).toBe(false);
        expect(doesNotExist.latestVersion).toBeUndefined();
    });

    it("options", async () => {
        const dm2 = Documentalist.create().use(
            "package.json",
            new NpmPlugin({ excludeNames: [/two/i], excludePrivate: true }),
        );
        const { npm } = await dm2.documentFiles([
            {
                // excludePrivate
                path: "one/package.json",
                read: () => `{ "name": "packageOne", "private": true, "version": "1.0.0" }`,
            },
            {
                // excludeNames
                path: "two/package.json",
                read: () => `{ "name": "packageTwo", "version": "1.0.0" }`,
            },
        ]);
        expect(Object.keys(npm)).toHaveLength(0);
    });
});
