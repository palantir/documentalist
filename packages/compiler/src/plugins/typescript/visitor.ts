/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    ICompiler,
    ITsClass,
    ITsConstructor,
    ITsDocBase,
    ITsEnum,
    ITsEnumMember,
    ITsFlags,
    ITsInterface,
    ITsMethod,
    ITsParameter,
    ITsProperty,
    ITsSignature,
    ITsTypeAlias,
    Kind,
} from "@documentalist/client";
import { relative } from "path";
import {
    DeclarationReflection,
    ParameterReflection,
    ProjectReflection,
    Reflection,
    ReflectionKind,
    SignatureReflection,
} from "typedoc";
import { Comment, UnionType } from "typedoc/dist/lib/models";
import { DefaultValueContainer } from "typedoc/dist/lib/models/reflections/abstract";
import { ITypescriptPluginOptions } from "./index";
import { resolveSignature, resolveTypeString } from "./typestring";

export class Visitor {
    public constructor(private compiler: ICompiler, private options: ITypescriptPluginOptions) {}

    public visitProject(project: ProjectReflection) {
        const { excludePaths = [] } = this.options;
        // get top-level members of typedoc project
        return [
            ...this.visitChildren(project.getReflectionsByKind(ReflectionKind.Class), this.visitClass),
            ...this.visitChildren(project.getReflectionsByKind(ReflectionKind.Enum), this.visitEnum),
            ...this.visitChildren(project.getReflectionsByKind(ReflectionKind.Interface), this.visitInterface),
            ...this.visitChildren(
                // detect if a `const X = { A, B, C }` also has a corresponding `type X = A | B | C`
                project.getReflectionsByKind(ReflectionKind.ObjectLiteral).filter(isConstTypePair),
                this.visitConstTypePair,
            ),
            ...this.visitChildren<ITsTypeAlias>(project.getReflectionsByKind(ReflectionKind.TypeAlias), def => ({
                ...this.makeDocEntry(def, Kind.TypeAlias),
                type: resolveTypeString(def.type),
            })),
        ].filter(
            // remove members excluded by path option
            ref => isNotExcluded(excludePaths, ref.fileName),
        );
    }

    private makeDocEntry<K extends Kind>(def: Reflection, kind: K): ITsDocBase<K> {
        return {
            documentation: this.renderComment(def.comment),
            fileName: getSourceFileName(def),
            flags: getFlags(def),
            kind,
            name: def.name,
            sourceUrl: getSourceUrl(def),
        };
    }

    private visitClass = (def: DeclarationReflection): ITsClass => ({
        ...this.visitInterface(def),
        constructorType: this.visitChildren(
            def.getChildrenByKind(ReflectionKind.Constructor),
            this.visitConstructor,
        )[0],
        kind: Kind.Class,
    });

    private visitInterface = (def: DeclarationReflection): ITsInterface => ({
        ...this.makeDocEntry(def, Kind.Interface),
        extends: def.extendedTypes && def.extendedTypes.map(resolveTypeString),
        implements: def.implementedTypes && def.implementedTypes.map(resolveTypeString),
        indexSignature: def.indexSignature && this.visitSignature(def.indexSignature),
        methods: this.visitChildren(def.getChildrenByKind(ReflectionKind.Method), this.visitMethod, sortStaticFirst),
        properties: this.visitChildren(
            def.getChildrenByKind(ReflectionKind.Property),
            this.visitProperty,
            sortStaticFirst,
        ),
    });

    private visitConstructor = (def: DeclarationReflection): ITsConstructor => ({
        ...this.visitMethod(def),
        kind: Kind.Constructor,
    });

    private visitConstTypePair = (def: DeclarationReflection): ITsEnum => ({
        ...this.makeDocEntry(def, Kind.Enum),
        // ObjectLiteral has Variable children, but we'll expose them as enum members
        members: this.visitChildren<ITsEnumMember>(def.getChildrenByKind(ReflectionKind.Variable), m => ({
            ...this.makeDocEntry(m, Kind.EnumMember),
            defaultValue: resolveTypeString(m.type),
        })),
    });

    private visitEnum = (def: DeclarationReflection): ITsEnum => ({
        ...this.makeDocEntry(def, Kind.Enum),
        members: this.visitChildren<ITsEnumMember>(def.getChildrenByKind(ReflectionKind.EnumMember), m => ({
            ...this.makeDocEntry(m, Kind.EnumMember),
            defaultValue: getDefaultValue(m),
        })),
    });

    private visitProperty = (def: DeclarationReflection): ITsProperty => ({
        ...this.makeDocEntry(def, Kind.Property),
        defaultValue: getDefaultValue(def),
        inheritedFrom: def.inheritedFrom && resolveTypeString(def.inheritedFrom),
        type: resolveTypeString(def.type),
    });

    private visitMethod = (def: DeclarationReflection): ITsMethod => ({
        ...this.makeDocEntry(def, Kind.Method),
        inheritedFrom: def.inheritedFrom && resolveTypeString(def.inheritedFrom),
        signatures: def.signatures !== undefined ? def.signatures.map(sig => this.visitSignature(sig)) : [],
    });

    private visitSignature = (sig: SignatureReflection): ITsSignature => ({
        ...this.makeDocEntry(sig, Kind.Signature),
        flags: undefined,
        parameters: (sig.parameters || []).map(param => this.visitParameter(param)),
        returnType: resolveTypeString(sig.type),
        type: resolveSignature(sig),
    });

    private visitParameter = (param: ParameterReflection): ITsParameter => ({
        ...this.makeDocEntry(param, Kind.Parameter),
        defaultValue: getDefaultValue(param),
        sourceUrl: undefined,
        type: resolveTypeString(param.type),
    });

    /** Visits each child that passes the filter condition (based on options). */
    private visitChildren<T extends ITsDocBase>(
        children: Reflection[],
        visitor: (def: DeclarationReflection) => T,
        comparator?: (a: T, b: T) => number,
    ): T[] {
        const { excludeNames = [], excludePaths = [], includeNonExportedMembers = false } = this.options;
        return children
            .filter(ref => ref.flags.isExported || includeNonExportedMembers)
            .map(visitor)
            .filter(doc => isNotExcluded(excludeNames, doc.name) && isNotExcluded(excludePaths, doc.fileName))
            .sort(comparator);
    }

    /**
     * Converts a typedoc comment object to a rendered `IBlock`.
     */
    private renderComment(comment: Comment | undefined) {
        if (!comment) {
            return undefined;
        }
        let documentation = "";
        if (comment.shortText) {
            documentation += comment.shortText;
        }
        if (comment.text) {
            documentation += "\n\n" + comment.text;
        }
        if (comment.tags) {
            documentation +=
                "\n\n" +
                comment.tags
                    .filter(tag => tag.tagName !== "default" && tag.tagName !== "deprecated")
                    .map(tag => `@${tag.tagName} ${tag.text}`)
                    .join("\n");
        }
        return this.compiler.renderBlock(documentation);
    }
}

function getCommentTag(comment: Comment | undefined, tagName: string) {
    if (comment == null || comment.tags == null) {
        return undefined;
    }
    return comment.tags.filter(tag => tag.tagName === tagName)[0];
}

function getDefaultValue(ref: DefaultValueContainer): string | undefined {
    if (ref.defaultValue != null) {
        return ref.defaultValue;
    }
    const defaultValue = getCommentTag(ref.comment, "default");
    if (defaultValue !== undefined) {
        return defaultValue.text.trim();
    }
    return undefined;
}

function getSourceFileName({ sources = [] }: Reflection): string | undefined {
    const source = sources[0];
    const fileName = source && source.file && source.file.fullFileName;
    // filename relative to cwd, so it can be saved in a snapshot (machine-independent)
    return fileName && relative(process.cwd(), fileName);
}

function getSourceUrl({ sources = [] }: Reflection): string | undefined {
    const source = sources[0];
    return source && source.url;
}

function getFlags(ref: Reflection): ITsFlags | undefined {
    if (ref === undefined || ref.flags === undefined) {
        return undefined;
    }
    const isDeprecated = getIsDeprecated(ref);
    const { isExported, isExternal, isOptional, isPrivate, isProtected, isPublic, isRest, isStatic } = ref.flags;
    return { isDeprecated, isExported, isExternal, isOptional, isPrivate, isProtected, isPublic, isRest, isStatic };
}

function getIsDeprecated(ref: Reflection) {
    const deprecatedTag = getCommentTag(ref.comment, "deprecated");
    if (deprecatedTag === undefined) {
        return undefined;
    }
    const text = deprecatedTag.text.trim();
    return text === "" ? true : text;
}

function isConstTypePair(def: DeclarationReflection) {
    return def.kind === ReflectionKind.ObjectLiteral && def.type instanceof UnionType;
}

/** Returns true if value does not match all patterns. */
function isNotExcluded(patterns: Array<string | RegExp>, value?: string) {
    return value === undefined || patterns.every(p => value.match(p) == null);
}

/** Sorts static members (`flags.isStatic`) before non-static members. */
function sortStaticFirst<T extends ITsDocBase>({ flags: aFlags = {} }: T, { flags: bFlags = {} }: T) {
    if (aFlags.isStatic && bFlags.isStatic) {
        return 0;
    } else if (aFlags.isStatic) {
        return -1;
    } else if (bFlags.isStatic) {
        return 1;
    }
    return 0;
}
