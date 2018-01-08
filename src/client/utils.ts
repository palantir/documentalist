/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

/**
 * Splits the `text` string into words and invokes the `callback` for each word that is
 * found in the `data` record. If not found, the word appears unchanged in the output
 * array.
 *
 * Example:
 * ```tsx
 * linkify("string | ITag", docs.typescript, (name) => <a href={`#api/${name}`}>{name}</a>)
 * // =>
 * ["string", " | ", <a href="#api/ITag">ITag</a>]
 * ```
 */
export function linkify<D, T>(
    text: string,
    data: Record<string, D>,
    callback: (name: string, data: D) => T,
): Array<string | T> {
    return text.split(WORD_SEPARATORS).map(word => (data[word] == null ? word : callback(word, data[word])));
}
const WORD_SEPARATORS = /([\[\]<>()| :.,]+)/g;

/** Slugify a string: "Really Cool Heading!" => "really-cool-heading-" */
export function slugify(str: string) {
    return str.toLowerCase().replace(/[^\w.\/]/g, "-");
}
