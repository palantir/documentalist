
// import tsdoc from "ts-quick-docs";
import { IPlugin } from "./plugin";
import { Documentalist } from "..";

export class TypescriptPlugin implements IPlugin {
    public compile(_documentalist: Documentalist, _markdownFiles: string[]) {
        return {};
        // return tsdoc.fromFiles(markdownFiles, {}); // TODO apply markdown to comment blocks
    }
}
