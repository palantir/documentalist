import { Comment, Declaration, Root, Rule } from "postcss";
import * as postcss from "postcss";
import { readFileSync } from "fs";
import { IPlugin } from "./plugin";
import { Documentalist } from "..";

export interface IDeclaration {
    prop: string;
    value: string;
}

export interface IRule {
    comment?: string;
    commentRaw?: string;
    selector: string;
    declarations: IDeclaration[];
}

export interface ICss {
    filePath: string;
    rules: IRule[];
}

export class CssPlugin implements IPlugin {
    public compile(_documentalist: Documentalist, cssFiles: string[]) {
        const csses = [] as ICss[];
        cssFiles.forEach((filePath: string) => {
            const cssContent = readFileSync(filePath, "utf8");
            const cssResult = {filePath, rules: []};
            postcss([this.processor(cssResult)]).process(cssContent).css; // .css makes this synchronous
            csses.push(cssResult);
        });
        return csses;
    }

    private processor(cssResult: ICss) {
        return (css: Root) => {
            css.walkRules((rule: Rule) => {
                const ruleResult = {
                    selector: rule.selector,
                    declarations: [],
                } as IRule;

                const prevNode = rule.prev();
                if (prevNode != null && prevNode.type === "comment") {
                    const text = (prevNode as Comment).text
                        .replace(/^ *\*+/, "")
                        .replace(/\n *\*+/g, "\n"); // trim asterisks, maintain newlines
                    ruleResult.commentRaw = text;
                    ruleResult.comment = text; // TODO apply markdown to comment blocks
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
