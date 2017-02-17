import * as path from "path";
import { ContentNode, isTag } from "./";
import { PartialPageData } from "./page";

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

    title?: string;

    /** Metadata is parsed from YAML front matter in files and can contain arbitrary data. */
    [key: string]: any;
}

export interface IPageData {
    absolutePath: string;
    contentRaw: string;
    contents: ContentNode[];
    metadata: IMetadata;
    reference: string;
    title: string;
}

export type PartialPageData = Pick<IPageData, "absolutePath" | "contentRaw" | "contents" | "metadata">;

export function makePage(props: PartialPageData): IPageData {
    const title = getTitle(props);
    const reference = getReference(props, title);
    return { ...props, reference, title };
}

function getReference(data: PartialPageData, title: string) {
    if (data.metadata.reference != null) {
        return data.metadata.reference;
    }
    return title || path.basename(data.absolutePath, path.extname(data.absolutePath));
}

function getTitle(data: PartialPageData) {
    if (data.metadata.title !== undefined) {
        return data.metadata.title;
    }

    const first = data.contents[0];
    if (isTag(first) && first.tag.match(/^#+$/)) {
        return first.value as string;
    }

    return "(untitled)";
}

// function getQualifiedReference(data: IPageData) {
//     const ref = getReference(data);
//     if (data.metadata.parent !== undefined) {
//         return [data.metadata.parent, ref].join(".");
//     }
//     return ref;
// }
