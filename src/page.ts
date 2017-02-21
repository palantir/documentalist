import * as path from "path";
import { IPageData, isTag } from "./client";

export type PartialPageData = Pick<IPageData, "absolutePath" | "contentRaw" | "contents" | "metadata">;

export function makePage(props: PartialPageData): IPageData {
    const title = getTitle(props);
    const reference = getReference(props);
    return { ...props, reference, title };
}

function getReference(data: PartialPageData) {
    if (data.metadata.reference != null) {
        return data.metadata.reference;
    }
    return path.basename(data.absolutePath, path.extname(data.absolutePath));
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
