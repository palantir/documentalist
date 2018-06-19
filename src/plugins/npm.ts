/**
 * Copyright 2018-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { spawn } from "child_process";
import { relative } from "path";
import { ICompiler, IFile, INpmPackage, INpmPluginData, IPlugin } from "../client";

/**
 * The `NpmPlugin` parses `package.json` files and emits data about each
 * NPM package. Packages marked `private: true` will be ignored.
 */
export class NpmPlugin implements IPlugin<INpmPluginData> {
    public async compile(packageJsons: IFile[], _dm: ICompiler): Promise<INpmPluginData> {
        const info = await Promise.all(packageJsons.map(this.parseNpmInfo));
        const npm = arrayToObject(info.filter(isDefined), pkg => pkg.name);
        return { npm };
    }

    private parseNpmInfo = async (packageJson: IFile): Promise<INpmPackage | undefined> => {
        const json = JSON.parse(packageJson.read());
        if (json.private === true) {
            // ignore private packages as they will not appear in `npm info`
            return undefined;
        }
        const data = JSON.parse(await this.getNpmInfo(json.name));
        return {
            name: data.name,
            // tslint:disable-next-line:object-literal-sort-keys
            description: data.description,
            latestVersion: data["dist-tags"].latest,
            nextVersion: data["dist-tags"].next,
            sourcePath: relative(process.cwd(), packageJson.path),
            versions: data.versions,
        };
    };

    private getNpmInfo(packageName: string) {
        return new Promise<string>(resolve => {
            let stdout = "";
            const child = spawn("npm", ["info", "--json", packageName]);
            child.stdout.setEncoding("utf8");
            child.stdout.on("data", data => (stdout += data));
            child.on("close", () => resolve(stdout));
        });
    }
}

function arrayToObject<T>(array: T[], keyFn: ((item: T) => string)) {
    const obj: { [key: string]: T } = {};
    array.forEach(item => (obj[keyFn(item)] = item));
    return obj;
}

function isDefined<T>(arg: T | undefined): arg is T {
    return arg !== undefined;
}
