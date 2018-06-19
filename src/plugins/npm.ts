/**
 * Copyright 2018-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { spawn } from "child_process";
import { ICompiler, IFile, INpmPackage, INpmPluginData, IPlugin } from "../client";

/**
 * The `NpmPlugin` parses `package.json` files and emits data about each
 * NPM package.
 */
export class NpmPlugin implements IPlugin<INpmPluginData> {
    public async compile(packageJsons: IFile[], _dm: ICompiler): Promise<INpmPluginData> {
        const npm = await Promise.all<string>(
            // resolve promises in parallel
            packageJsons
                .map(pkg => JSON.parse(pkg.read()))
                .filter(json => json.private !== true)
                .map(json => this.getNpmInfo(json.name)),
        )
            .then(infos => infos.map(this.parseNpmInfo))
            .then(infos => arrayToObject(infos, pkg => pkg.name));
        return { npm };
    }

    private getNpmInfo(packageName: string) {
        return new Promise<string>(resolve => {
            let stdout = "";
            const child = spawn("npm", ["info", "--json", packageName]);
            child.stdout.setEncoding("utf8");
            child.stdout.on("data", data => (stdout += data));
            child.on("close", () => resolve(stdout));
        });
    }

    private parseNpmInfo(info: string): INpmPackage {
        const data = JSON.parse(info);
        return {
            name: data.name,
            // tslint:disable-next-line:object-literal-sort-keys
            description: data.description,
            latestVersion: data["dist-tags"].latest,
            nextVersion: data["dist-tags"].next,
            versions: data.versions,
        };
    }
}

function arrayToObject<T>(array: T[], keyFn: ((item: T) => string)) {
    const obj: { [key: string]: T } = {};
    array.forEach(item => (obj[keyFn(item)] = item));
    return obj;
}
