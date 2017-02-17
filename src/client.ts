import { IPageData } from "./page";
import { ITreeEntry, ITreeNode } from "./plugins/markdown";
import { IInterfaceEntry } from "./plugins/typescript";
import { ITag, isTag, ContentNode } from "./";

// explicitly export all the interfaces
export { IBlock } from "./";
export { IMetadata, IPageData } from "./page";
export { ICss, IDeclaration, IRule } from "./plugins/css";
export { ITreeEntry, ITreeNode } from "./plugins/markdown";
export { IPlugin } from "./plugins/plugin";
export { IDocEntry, IInterfaceEntry, IPropertyEntry } from "./plugins/typescript";

export interface IMarkdownDocs {
    layout: ITreeNode[];
    pages: { [key: string]: IPageData };
}

export interface IDocumentalistData {
    docs: IMarkdownDocs;
    ts: IInterfaceEntry[];
}

export type INavigableVisitor = (navigable: ITreeEntry) => void;

export function visitNavigables(data: IDocumentalistData, initialPage: IPageData,  visitor: INavigableVisitor) {
    if (initialPage.contents != null) {
        initialPage.contents.forEach((node: ContentNode, i: number) => {
            if (isTag(node)) {
                if (node.tag == "page") {
                    const subpage = data.docs.pages[node.value as string];
                    visitor({
                        title: "top " + subpage.reference,
                        reference: subpage.reference
                    });
                    visitNavigables(data, subpage, visitor);
                }
                if (i != 0 && node.tag.match(/^#+$/)) {
                    visitor({
                        title: node.value.toString(),
                        reference: node.value.toString()
                    });
                }
            }
        });
    }
}

export interface INavigableNode extends ITreeEntry {
    level: number;
    children: INavigableNode[];
}

function initPageNode(page: IPageData, level: number): INavigableNode {
    return {
        title: page.reference,
        reference: page.reference,
        level,
        children: [],
    };
}

function initHeaderNode(node: ITag, level: number): INavigableNode {
    return {
        title: node.value.toString(),
        reference: node.value.toString(),
        level,
        children: [],
    }
}

export function createNavigableTree(data: IDocumentalistData, page: IPageData, level = 0) {
    const pageNode: INavigableNode = initPageNode(page, level);
    if (page.contents != null) {
        page.contents.forEach((node: ContentNode, i: number) => {
            if (isTag(node)) {
                if (node.tag == "page") {
                    const subpage = data.docs.pages[node.value as string];
                    pageNode.children.push(createNavigableTree(data, subpage, level + 1));
                }
                if (i != 0 && node.tag.match(/^#+$/)) {
                    pageNode.children.push(initHeaderNode(node, level + 1));
                }
            }
        });
    }
    return pageNode;
}
