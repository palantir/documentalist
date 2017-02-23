/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as postcss from "postcss";
import { Comment, Root, Rule } from "postcss";
import * as postcssScss from "postcss-scss";

import { Documentalist } from "..";
import { StringOrTag } from "../client";
import { IFile, IPlugin } from "./plugin";

export interface IDeclaration {
    prop: string;
    value: string;
}

export interface IRule {
    comment?: StringOrTag[];
    commentRaw?: string;
    selector: string;
    declarations: IDeclaration[];
    metadata?: any;
}

export interface ICss {
    filePath: string;
    rules: IRule[];
}

export class CssPlugin implements IPlugin<ICss[]> {
    public name = "css";

    public compile(documentalist: Documentalist, cssFiles: IFile[]) {
        const csses = [] as ICss[];
        cssFiles.forEach((file) => {
            const cssContent = file.read();
            const cssResult = {filePath: file.path, rules: []};
            postcss([this.processor(documentalist, cssResult)])
                .process(cssContent, { syntax: postcssScss })
                .css; // this statement makes the whole thing synchronous
            csses.push(cssResult);
        });
        return csses;
    }

    private processor(documentalist: Documentalist, cssResult: ICss) {
        return (css: Root) => {
            css.walkRules((rule: Rule) => {
                const ruleResult = {
                    declarations: [],
                    selector: rule.selector,
                } as IRule;

                const prevNode = rule.prev();
                if (prevNode != null && prevNode.type === "comment") {
                    const block = (prevNode as Comment).text
                        .replace(/^ *\*+ */, "")
                        .replace(/\n *\*+ */g, "\n")
                        .trim(); // trim asterisks, maintain newlines

                    const { content, metadata, renderedContent } = documentalist.renderBlock(block);
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
