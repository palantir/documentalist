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

import { ICompiler, IFile, IKssExample, IKssModifier, IKssPluginData, IPlugin } from "@documentalist/client";
import * as kss from "kss";
import * as path from "path";

/**
 * The `KssPlugin` extracts [KSS doc comments](http://warpspire.com/kss/syntax/) from CSS code (or similar languages).
 * It emits an object keyed by the "styleguide [ref]" section of the comment. The documentation, markup, and modifiers
 * sections will all be emitted in the data.
 *
 * @see IKssExample
 */
export class KssPlugin implements IPlugin<IKssPluginData> {
    public constructor(private options: kss.Options = {}) {}

    public compile(cssFiles: IFile[], dm: ICompiler): IKssPluginData {
        const styleguide = this.parseFiles(cssFiles);
        const sections = styleguide.sections().map((s) => convertSection(s, dm));
        const css = dm.objectify(sections, (s) => s.reference);
        return { css };
    }

    private parseFiles(files: IFile[]) {
        const input = files.map<kss.File>((file) => ({
            base: path.dirname(file.path),
            contents: file.read(),
            path: file.path,
        }));
        const options = { multiline: false, markdown: false, ...this.options };
        return kss.parse(input, options);
    }
}

function convertSection(section: kss.KssSection, dm: ICompiler): IKssExample {
    return {
        documentation: dm.renderMarkdown(section.description()),
        markup: section.markup() || "",
        markupHtml: dm.renderMarkdown(`\`\`\`html\n${section.markup() || ""}\n\`\`\``),
        modifiers: section.modifiers().map((mod) => convertModifier(mod, dm)),
        reference: section.reference(),
    };
}

function convertModifier(mod: kss.KssModifier, dm: ICompiler): IKssModifier {
    return {
        documentation: dm.renderMarkdown(mod.description()),
        name: mod.name(),
    };
}
