import { Documentalist } from "..";

export interface IPlugin {
    compile: (doc: Documentalist, files: string[]) => any;
}
