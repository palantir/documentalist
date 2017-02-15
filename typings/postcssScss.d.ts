
declare module "postcss-scss" {
    import { Processor } from "postcss";

    var processor: Processor;
    export = processor;
}