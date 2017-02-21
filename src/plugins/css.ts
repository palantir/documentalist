import { Comment, Declaration, Root, Rule } from "postcss";
import * as postcss from "postcss";
import * as postcssScss from "postcss-scss";
import { readFileSync } from "fs";
import { IPlugin } from "./plugin";
import { Documentalist, ContentNode } from "..";

export interface IDeclaration {
    prop: string;
    value: string;
}

export interface IRule {
    comment?: ContentNode[];
    commentRaw?: string;
    selector: string;
    declarations: IDeclaration[];
    metadata?: any;
}

export interface ICss {
    filePath: string;
    rules: IRule[];
}

export class CssPlugin implements IPlugin {
    public name = "css";

    public compile(documentalist: Documentalist, cssFiles: string[]) {
        const csses = [] as ICss[];
        cssFiles.forEach((filePath: string) => {
            const cssContent = readFileSync(filePath, "utf8");
            const cssResult = {filePath, rules: []};
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
