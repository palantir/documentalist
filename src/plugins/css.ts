/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as postcss from "postcss";
import { Comment, Root, Rule } from "postcss";
import * as postcssScss from "postcss-scss";
import { StringOrTag } from "../client";
import { ICompiler } from "../compiler";
import { IFile, IPlugin } from "./plugin";

export interface ICssDeclaration {
    prop: string;
    value: string;
}

export interface ICssRule {
    comment?: StringOrTag[];
    commentRaw?: string;
    selector: string;
    declarations: ICssDeclaration[];
    metadata?: any;
}

export interface ICss {
    filePath: string;
    rules: ICssRule[];
}

export interface ICssPluginData {
    css: ICss[];
}

export class CssPlugin implements IPlugin<ICssPluginData> {

    public compile(cssFiles: IFile[], doc: ICompiler) {
        const css = [] as ICss[];
        cssFiles.forEach((file) => {
            const cssContent = file.read();
            const cssResult = {filePath: file.path, rules: []};
            postcss([this.processor(doc, cssResult)])
                .process(cssContent, { syntax: postcssScss })
                .css; // this statement makes the whole thing synchronous
            css.push(cssResult);
        });
        return { css };
    }

    private processor(doc: ICompiler, cssResult: ICss) {
        return (css: Root) => {
            css.walkRules((rule: Rule) => {
                const ruleResult = {
                    declarations: [],
                    selector: rule.selector,
                } as ICssRule;

                const prevNode = rule.prev();
                if (prevNode != null && prevNode.type === "comment") {
                    const block = (prevNode as Comment).text
                        .replace(/^ *\*+ */, "")
                        .replace(/\n *\*+ */g, "\n")
                        .trim(); // trim asterisks, maintain newlines

                    const { content, metadata, renderedContent } = doc.renderBlock(block);
                    ruleResult.metadata = metadata;
                    ruleResult.commentRaw = content;
                    ruleResult.comment = renderedContent;
                }

                rule.walkDecls(({ prop, value }) => ruleResult.declarations.push({ prop, value }));

                cssResult.rules.push(ruleResult);
            });
        };
    }
}
