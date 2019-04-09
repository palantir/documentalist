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

/** A single modifier for an example. */
export interface IKssModifier {
    documentation: string;
    name: string;
}

/**
 * A markup/modifiers example parsed from a KSS comment block.
 */
export interface IKssExample {
    /** Raw documentation string. */
    documentation: string;
    /**
     * Raw HTML markup for example with `{{.modifier}}` templates,
     * to be used to render the markup for each modifier.
     */
    markup: string;
    /**
     * Syntax-highlighted version of the markup HTML, to be used
     * for rendering the markup itself with pretty colors.
     */
    markupHtml: string;
    /** Array of modifiers supported by HTML markup. */
    modifiers: IKssModifier[];
    /** Unique reference for addressing this example. */
    reference: string;
}

/**
 * The `KssPlugin` exports a `css` key that contains a map of styleguide references to markup/modifier examples.
 *
 * @see KSSPlugin
 */
export interface IKssPluginData {
    css: {
        [reference: string]: IKssExample;
    };
}
