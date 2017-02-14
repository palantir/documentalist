import * as fs from "fs";
import * as path from "path";
import { IDocEntry, IInterfaceEntry } from "ts-quick-docs/dist/interfaces";
import { DocPage } from "./";
import { IDocumentalistData } from "./client";

// tslint:disable-next-line:no-var-requires
const data = require("../dist/data.json") as IDocumentalistData;

function isInterfaceEntity(entity: IDocEntry): entity is IInterfaceEntry {
    return entity.type === "interface";
}


type TagRenderFn = (value: string | true, page: DocPage) => string;
const TAGS: { [tag: string]: TagRenderFn } = {
    reference: (value, page) => {
        if (value === true) { throw new Error("@reference expects argument"); }
        const [relative, name] = value.split(" ");
        const filepath = path.relative(process.cwd(), path.resolve(path.dirname(page.data.absolutePath), relative));
        const entity = data.entities.find((e) => e.name === name && e.fileName === filepath);
        if (entity === undefined) {
            throw new Error(`@reference '${name}' not found in '${filepath}'`);
        }

        if (isInterfaceEntity(entity)) {
            const props = entity.properties!.map((prop) => `<li><code>${prop.name}</code>${prop.documentation}</li>`);
            return `<h1>${entity.name}</h1><ul>${props.join("")}</ul>`;
        }
        return "";
    },
};

Object.keys(data.pages).map((pageName) => {
    const page = data.pages[pageName];
    if (page.data.contents === undefined) {
        console.log(`skipping empty page '${page.reference}'`);
        return;
    }
    const contents = page.data.contents.reduce<string>((acc, content) => {
        if (typeof content === "string") {
            return acc + content;
        } else {
            return acc + TAGS[content.tag](content.value, page);
        }
    }, "");
    const filename = `dist/${page.reference}.html`;
    fs.writeFileSync(filename, contents);
    console.log(`write ${filename}`);
})
