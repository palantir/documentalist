/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
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

export interface IKssPluginData {
    css: {
        [reference: string]: IKssExample;
    };
}
