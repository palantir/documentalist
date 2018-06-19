/**
 * Copyright 2018-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

export interface INpmPackage {
    /** Package name. */
    name: string;

    /** Package description. */
    description?: string;

    /** Latest version of the package (npm `latest` dist-tag). */
    latestVersion: string;

    /** Next version of the package (npm `next` dist-tag). */
    nextVersion?: string;

    /** Whether this package is marked `private`. */
    private: boolean;

    /** Whether this package is published to NPM. */
    published: boolean;

    /** Relative path from `sourceBaseDir` to this package. */
    sourcePath: string;

    /** All published versions of this package. */
    versions: string[];
}

/**
 * The `KssPlugin` exports a `css` key that contains a map of styleguide references to markup/modifier examples.
 *
 * @see KSSPlugin
 */
export interface INpmPluginData {
    npm: {
        [packageName: string]: INpmPackage;
    };
}
