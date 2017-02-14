import tsdoc, { IInterfaceEntry } from "ts-quick-docs";
import { Documentalist } from "..";
import { IPlugin } from "./plugin";

// so the return type of `compile()` can be named
export { IInterfaceEntry };

export class TypescriptPlugin implements IPlugin {
    public name = "ts";

    public compile(_documentalist: Documentalist, markdownFiles: string[]) {
        return tsdoc.fromFiles(markdownFiles, {}); // TODO apply markdown to comment blocks
    }
}
