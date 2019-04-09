/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Documentalist } from "../documentalist";
import { NpmPlugin } from "../plugins/npm";

describe("NpmPlugin", () => {
    const dm = Documentalist.create().use("package.json", new NpmPlugin());

    it("npm info matches package.json", async () => {
        const {
            npm: { documentalist },
        } = await dm.documentGlobs("package.json");
        const pkg = require("../../package.json");
        // NOTE: not using snapshot as it would change with every release due to `npm info` call.
        expect(documentalist.name).toBe(pkg.name);
        expect(documentalist.description).toBe(pkg.description);
        expect(documentalist.version).toBe(pkg.version);
        expect(documentalist.latestVersion).toBeDefined(); // npm-info succeeded
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
