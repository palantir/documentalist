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
    callback: (name: string, data: D, index: number) => T,
): Array<string | T> {
    return text
        .split(WORD_SEPARATORS)
        .map((word, idx) => (data[word] == null ? word : callback(word, data[word], idx)));
}

const WORD_SEPARATORS = /([\[\]<>()| :.,]+)/g;

/**
 * Slugify a string: "Really Cool Heading!" => "really-cool-heading-"
 */
export function slugify(str: string) {
    return str.toLowerCase().replace(/[^\w.\/]/g, "-");
}
