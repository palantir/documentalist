import * as toc from "markdown-toc";
import * as path from "path";

export type ContentNode = string | { tag: string, value: string | true };

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
    contents?: ContentNode[];
    headings: toc.Heading[];
    metadata: M;
}

export class Page<M extends IMetadata> {
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
