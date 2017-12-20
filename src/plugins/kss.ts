/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as kss from "kss";
import * as path from "path";
import { IKssExample, IKssModifier, IKssPluginData } from "../client";
import { ICompiler, IFile, IPlugin } from "./plugin";

export class KssPlugin implements IPlugin<IKssPluginData> {
    public constructor(private options: kss.IOptions = {}) {}

    public compile(cssFiles: IFile[], dm: ICompiler) {
        const styleguide = this.parseFiles(cssFiles);
        const sections = styleguide.sections().map(s => convertSection(s, dm));
        const css = dm.objectify(sections, s => s.reference);
        return { css };
    }

    private parseFiles(files: IFile[]) {
        const input = files.map<kss.IFile>(file => ({
            base: path.dirname(file.path),
            contents: file.read(),
            path: file.path,
        }));
        const options = { multiline: false, markdown: false, ...this.options };
        return kss.parse(input, options);
    }
}

function convertSection(section: kss.ISection, dm: ICompiler): IKssExample {
    return {
        documentation: dm.renderMarkdown(section.description()),
        markup: section.markup() || "",
        markupHtml: dm.renderMarkdown(`\`\`\`html\n${section.markup() || ""}\n\`\`\``),
        modifiers: section.modifiers().map(mod => convertModifier(mod, dm)),
        reference: section.reference(),
    };
}

function convertModifier(mod: kss.IModifier, dm: ICompiler): IKssModifier {
    return {
        documentation: dm.renderMarkdown(mod.description()),
        name: mod.name(),
    };
}
