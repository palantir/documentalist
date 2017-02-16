import * as path from "path";
import { ContentNode } from "./";
import { IMetadata, IPageData } from "./page";

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

export interface IHeading {
    content: string;
    i: number;
    lvl: number;
    seen: number;
    slug: string;
}

export interface IPageData<M> {
    absolutePath: string;
    contentRaw: string;
    contents?: ContentNode[];
    headings: IHeading[];
    metadata: M;
}

export class Page<M extends IMetadata> {
    public readonly reference: string;

    public constructor(public data: IPageData<M>) {
        this.reference = getQualifiedReference(data);
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

function getQualifiedReference(data: IPageData<IMetadata>) {
    const ref = getReference(data);
    if (data.metadata.parent !== undefined) {
        return [data.metadata.parent, ref].join(".");
    }
    return ref;
}
