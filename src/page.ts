import * as path from "path";
import { ContentNode } from "./";

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

    /** Metadata is parsed from YAML front matter in files and can contain arbitrary data. */
    [key: string]: any;
}

export interface IHeading {
    content: string;
    lvl: number;
    slug: string;
}

export interface IPageData {
    absolutePath: string;
    contentRaw: string;
    contents?: ContentNode[];
    headings: IHeading[];
    metadata: IMetadata;
}

export class Page {
    public readonly reference: string;

    public constructor(public data: IPageData) {
        this.reference = getQualifiedReference(data);
    }
}

function getReference(data: IPageData) {
    if (data.metadata.reference != null) {
        return data.metadata.reference;
    } else if (data.headings.length > 0) {
        return data.headings[0].slug;
    } else {
        return path.basename(data.absolutePath, path.extname(data.absolutePath));
    }
}

function getQualifiedReference(data: IPageData) {
    const ref = getReference(data);
    if (data.metadata.parent !== undefined) {
        return [data.metadata.parent, ref].join(".");
    }
    return ref;
}
