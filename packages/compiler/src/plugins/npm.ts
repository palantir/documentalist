/**
 * Copyright 2018 Palantir Technologies, Inc. All rights reserved.
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

import { ICompiler, IFile, INpmPackage, INpmPluginData, IPlugin } from "@documentalist/client";
import { spawn } from "child_process";

export interface INpmPluginOptions {
    /** Whether to exclude packages marked `private`. */
    excludePrivate?: boolean;

    /** Array of patterns to exclude packages by `name`. */
    excludeNames?: Array<string | RegExp>;
}

/**
 * The `NpmPlugin` parses `package.json` files and emits data about each NPM
 * package. It uses `npm info` to look up data about published packages, and
 * falls back to `package.json` info if the package is private or unpublished.
 */
export class NpmPlugin implements IPlugin<INpmPluginData> {
    public constructor(private options: INpmPluginOptions = {}) {}

    public async compile(packageJsons: IFile[], dm: ICompiler): Promise<INpmPluginData> {
        const info = await Promise.all(packageJsons.map((pkg) => this.parseNpmInfo(pkg, dm)));
        const { excludeNames, excludePrivate } = this.options;
        const npm = arrayToObject(
            info.filter((pkg) => isNotExcluded(excludeNames, pkg.name) && excludePrivate !== pkg.private),
            (pkg) => pkg.name,
        );
        return { npm };
    }

    private parseNpmInfo = async (packageJson: IFile, dm: ICompiler): Promise<INpmPackage> => {
        const sourcePath = dm.relativePath(packageJson.path);
        const json = JSON.parse(packageJson.read());
        const data = JSON.parse(await this.getNpmInfo(json.name));
        // `npm info` returns an error if it doesn't know the package
        // so we can use package.json data instead
        if (data.error) {
            return {
                name: json.name,
                published: false,
                version: json.version,
                // tslint:disable-next-line:object-literal-sort-keys
                description: json.description,
                private: json.private === true,
                sourcePath,
                versions: [json.version],
            };
        }

        const distTags = data["dist-tags"] || {};
        return {
            name: data.name,
            published: true,
            version: json.version,
            // tslint:disable-next-line:object-literal-sort-keys
            description: data.description,
            latestVersion: distTags.latest,
            nextVersion: distTags.next,
            private: false,
            sourcePath,
            versions: data.versions,
        };
    };

    private getNpmInfo(packageName: string) {
        return new Promise<string>((resolve) => {
            let stdout = "";
            const child = spawn("npm", ["info", "--json", packageName], {
                shell: true,
            });
            child.stdout.setEncoding("utf8");
            child.stdout.on("data", (data) => (stdout += data));
            child.on("close", () => resolve(stdout));
        });
    }
}

function arrayToObject<T>(array: T[], keyFn: (item: T) => string) {
    const obj: { [key: string]: T } = {};
    array.forEach((item) => (obj[keyFn(item)] = item));
    return obj;
}

/** Returns true if value does not match all patterns. */
function isNotExcluded(patterns: Array<string | RegExp> = [], value?: string) {
    return value === undefined || patterns.every((p) => value.match(p) == null);
}
