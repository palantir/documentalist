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

/**
 * NPM package metadata
 */
export interface NpmPackageInfo {
    /** Package name. */
    name: string;

    /** Package description. */
    description?: string;

    /** Version string from package.json. */
    version: string;

    /** NPM `latest` dist-tag version. */
    latestVersion?: string;

    /** NPM `next` dist-tag version. */
    nextVersion?: string;

    /** Whether this package is marked `private`. */
    private: boolean;

    /** Whether this package is published to NPM. */
    published: boolean;

    /** Relative path from `sourceBaseDir` to this package. */
    sourcePath: string;

    /** All published versions of this package. If published, this contains only `version`. */
    versions: string[];
}

/**
 * The `NpmPlugin` exports an `npm` key that contains a map of package names to their associated metadata.
 *
 * @see NpmPlugin
 */
export interface NpmPluginData {
    npm: {
        [packageName: string]: NpmPackageInfo;
    };
}
