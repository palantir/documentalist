import { Comment, Declaration, Root, Rule } from "postcss";
import * as postcss from "postcss";
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
            postcss([this.processor(documentalist, cssResult)]).process(cssContent).css; // .css makes this synchronous
            csses.push(cssResult);
        });
        return csses;
    }

    private processor(documentalist: Documentalist, cssResult: ICss) {
        return (css: Root) => {
            css.walkRules((rule: Rule) => {
                const ruleResult = {
                    selector: rule.selector,
                    declarations: [],
                } as IRule;

                const prevNode = rule.prev();
                if (prevNode != null && prevNode.type === "comment") {
                    const block = (prevNode as Comment).text
                        .replace(/^ *\*+ */, "")
                        .replace(/\n *\*+ */g, "\n")
                        .trim(); // trim asterisks, maintain newlines

                    const { content, metadata, renderedContent } = documentalist.renderBlock(block);
                    ruleResult.metadata = metadata
                    ruleResult.commentRaw = content;
                    ruleResult.comment = renderedContent;
                }

                rule.walkDecls((decl: Declaration) => {
                    ruleResult.declarations.push({
                        prop: decl.prop,
                        value: decl.value,
                    });
                });
                cssResult.rules.push(ruleResult);
            });
        };
    }
}
