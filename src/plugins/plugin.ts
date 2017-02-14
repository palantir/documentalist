import { Documentalist } from "..";

export interface IPlugin {
    name: string;

    compile: (doc: Documentalist, files: string[]) => any;
}
