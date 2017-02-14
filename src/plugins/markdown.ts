import { IPlugin } from "./plugin";
import { Documentalist } from "..";

export class MarkdownPlugin implements IPlugin {
    public compile(documentalist: Documentalist, markdownFiles: string[]) {
        documentalist.add(...markdownFiles);
        return {
            layout: documentalist.tree(),
            pages: documentalist.read(),
        } as any;
    }
}
