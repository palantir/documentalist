import * as toc from "markdown-toc";
import * as path from "path";
import { extractMetadata, readFile } from "./utils";

export interface IMetadata {
    /**
     * The section reference to which this page belongs.
     * A reference is typically the first header of a file, but can be overridden in IMetadata.
     */
    parent?: string;

    /**
     * Unique ID for finding this section.
     * The default value is the slug of the first heading in the file.
     */
    reference?: string;
}

export interface IPageData<M> {
    absolutePath: string;
    contents: string;
    headings: toc.Heading[];
    metadata: M;
}

export class Page<M extends IMetadata> {
    public static fromFile<M>(filepath: string) {
        const absolutePath = path.resolve(filepath);
        const { contents, metadata } = extractMetadata(readFile(absolutePath));
        return new Page<M>({
            absolutePath,
            contents,
            headings: toc(contents).json,
            metadata,
        })
    }

    public readonly reference: string;

    public constructor(public data: IPageData<M>) {
        this.reference = getReference(data);
    }
}

function getReference(data: IPageData<IMetadata>) {
    if (data.metadata.reference != null) {
        return data.metadata.reference;
    } else if (data.headings.length > 0) {
        return data.headings[0].slug;
    } else {
        return path.basename(data.absolutePath, path.extname(data.absolutePath));
    }
}
