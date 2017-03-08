/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as kss from "kss";
import * as path from "path";
import { ICompiler, IFile, IPlugin } from "./plugin";

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
    /** HTML markup for example, with `{{.modifier}}` templates. */
    markup: string;
    /** Array of modifiers supported by HTML markup. */
    modifiers: IKssModifier[];
    /** Unique reference for addressing this example. */
    reference: string;
}

export interface IKssPluginData {
    css: {
        [reference: string]: IKssExample;
    };
}

export class KssPlugin implements IPlugin<IKssPluginData> {
    public constructor(private options: kss.IOptions) {
    }

    public compile(cssFiles: IFile[], { objectify }: ICompiler) {
        const styleguide = this.parseFiles(cssFiles);
        const sections = styleguide.sections().map(convertSection);
        const css = objectify(sections, (s) => s.reference);
        return { css };
    }

    private parseFiles(files: IFile[]) {
        const input = files.map<kss.IFile>((file) => ({
            base: path.dirname(file.path),
            contents: file.read(),
            path: file.path,
        }));
        const options = { multiline: false, markdown: false, ...this.options };
        return kss.parse(input, options);
    }
}

function convertSection(section: kss.ISection): IKssExample {
    return {
        documentation: section.description(),
        markup: section.markup() || "",
        modifiers: section.modifiers().map(convertModifier),
        reference: section.reference(),
    };
}

function convertModifier(mod: kss.IModifier): IKssModifier {
    return {
        documentation: mod.description(),
        name: mod.name(),
    };
}
