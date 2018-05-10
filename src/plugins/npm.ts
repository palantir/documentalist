/**
 * Copyright 2018-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ICompiler, IFile, INpmPluginData, IPlugin } from "../client";

/**
 * The `NPMPlugin` extracts [KSS doc comments](http://warpspire.com/kss/syntax/) from CSS code (or similar languages).
 * It emits an object keyed by the "styleguide [ref]" section of the comment. The documentation, markup, and modifiers
 * sections will all be emitted in the data.
 */
export class NpmPlugin implements IPlugin<INpmPluginData> {
    public constructor(private options = {}) {}

    public async compile(packageJsons: IFile[], dm: ICompiler): Promise<INpmPluginData> {
        for (const pkg of packageJsons) {
            const { name, version } = JSON.parse(pkg.read());
            const info = await this.getNpmInfo(name);
            console.log(info);
        }
        return { npm: {} };
    }

    // private generateReleasesData() {
    //     const packageDirectories = fs
    //         .readdirSync(PACKAGES_DIR)
    //         .map(name => path.join(PACKAGES_DIR, name))
    //         .filter(source => fs.lstatSync(source).isDirectory());

    //     const releases = packageDirectories
    //         .filter(packagePath => fs.existsSync(path.resolve(packagePath, "package.json")))
    //         .map(packagePath => require(path.resolve(packagePath, "package.json")))
    //         // only include non-private projects
    //         .filter(project => !project.private)
    //         // just these two fields from package.json:
    //         .map(({ name, version }) => ({ name, version }));

    //     fs.writeFileSync(path.join(GENERATED_SRC_DIR, DOCS_RELEASES_FILENAME), JSON.stringify(releases, null, 2));
    // }

    // /**
    //  * Create a JSON file containing published versions of the documentation
    //  */
    // private generateVersionsData() {
    //     let stdout = "";
    //     const child = spawn("git", ["tag"]);
    //     child.stdout.setEncoding("utf8");
    //     child.stdout.on("data", data => {
    //         stdout += data;
    //     });
    //     child.on("close", () => {
    //         /** @type {Map<string, string>} */
    //         const majorVersionMap = stdout
    //             .split("\n")
    //             // turn @blueprintjs/core@* tags into version numbers
    //             .filter(val => /\@blueprintjs\/core\@[1-9]\d*\.\d+\.\d+.*/.test(val))
    //             .map(val => val.slice("@blueprintjs/core@".length))
    //             .reduce((map, version) => {
    //                 const major = semver.major(version);
    //                 if (!map.has(major) || semver.gt(version, map.get(major))) {
    //                     map.set(major, version);
    //                 }
    //                 return map;
    //             }, new Map());
    //         // sort in reverse order (so latest is first)
    //         const majorVersions = Array.from(majorVersionMap.values()).sort(semver.rcompare);

    //         console.info("[docs-data] Major versions found:", majorVersions.join(", "));

    //         fs.writeFileSync(
    //             path.join(GENERATED_SRC_DIR, DOCS_VERSIONS_FIELENAME),
    //             JSON.stringify(strMapToObj(majorVersionMap), null, 2),
    //         );
    //     });
    // }

    private getNpmInfo(packageName: string) {
        return new Promise<string>(resolve => {
            let stdout = "";
            const child = spawn("npm", ["info", packageName]);
            child.stdout.setEncoding("utf8");
            child.stdout.on("data", data => {
                stdout += data;
            });
            child.on("close", () => resolve(stdout));
        });
    }
}
