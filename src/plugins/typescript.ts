import tsdoc, { IJsDocTags, IPropertyEntry } from "ts-quick-docs";
import { Documentalist } from "..";
import { IPlugin } from "./plugin";

// so the return type of `compile()` can be named
export { IJsDocTags, IPropertyEntry };

export class TypescriptPlugin implements IPlugin {
    public name = "ts";

    public compile(_documentalist: Documentalist, markdownFiles: string[]) {
        // TODO apply markdown to comment blocks
        return tsdoc.fromFiles(markdownFiles, {}).map((entry) => {
            return {
                ...entry,
                documentation: _documentalist.renderBlock(entry.documentation),
            };
        });
    }
}
