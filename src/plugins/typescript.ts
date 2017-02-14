
import tsdoc from "ts-quick-docs";
import { IPlugin } from "./plugin";
import { Documentalist } from "..";

export class TypescriptPlugin implements IPlugin {
    public name = "ts";

    public compile(_documentalist: Documentalist, markdownFiles: string[]) {
        return tsdoc.fromFiles(markdownFiles, {}); // TODO apply markdown to comment blocks
    }
}
