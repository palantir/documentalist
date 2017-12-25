/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { relative } from "path";
import {
    DeclarationReflection,
    ParameterReflection,
    ProjectReflection,
    Reflection,
    ReflectionKind,
    SignatureReflection,
} from "typedoc";
import { Comment } from "typedoc/dist/lib/models/comments/comment";
import { DefaultValueContainer } from "typedoc/dist/lib/models/reflections/abstract";
import { ICompiler } from "../../client/compiler";
import {
    ITsClass,
    ITsConstructor,
    ITsDocBase,
    ITsFlags,
    ITsInterface,
    ITsMethod,
    ITsMethodParameter,
    ITsMethodSignature,
    ITsProperty,
    Kind,
} from "../../client/typescript";
import { ITypescriptPluginOptions } from "./index";
import { resolveSignature, resolveTypeString } from "./typestring";

export class Visitor {
    public constructor(private compiler: ICompiler, private options: ITypescriptPluginOptions) {}

    public visitProject(project: ProjectReflection) {
        // get top-level members of typedoc project
        const interfaces = this.visitChildren(
            project.getReflectionsByKind(ReflectionKind.Interface),
            this.visitInterface,
        );
        const classes = this.visitChildren(project.getReflectionsByKind(ReflectionKind.Class), this.visitClass);

        // remove members excluded by path option
        const { excludePaths = [] } = this.options;
        return [...interfaces, ...classes].filter(ref => isNotExcluded(excludePaths, ref.fileName));
    }

    private makeDocEntry<K extends Kind>(def: Reflection, kind: K) {
        return {
            documentation: this.renderComment(def.comment),
            fileName: getFileName(def),
            flags: getFlags(def),
            kind,
            name: def.name,
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

    private visitProperty = (def: DeclarationReflection): ITsProperty => ({
        ...this.makeDocEntry(def, Kind.Property),
        defaultValue: getDefaultValue(def),
        inheritedFrom: def.inheritedFrom && resolveTypeString(def.inheritedFrom),
        type: resolveTypeString(def.type),
    });

    private visitMethod = (def: DeclarationReflection): ITsMethod => ({
        ...this.makeDocEntry(def, Kind.Method),
        inheritedFrom: def.inheritedFrom && resolveTypeString(def.inheritedFrom),
        signatures: def.signatures.map(sig => this.visitSignature(sig)),
    });

    private visitSignature = (sig: SignatureReflection): ITsMethodSignature => ({
        ...this.makeDocEntry(sig, Kind.Signature),
        flags: undefined,
        parameters: (sig.parameters || []).map(param => this.visitParameter(param)),
        returnType: resolveTypeString(sig.type),
        type: resolveSignature(sig),
    });

    private visitParameter = (param: ParameterReflection): ITsMethodParameter => ({
        ...this.makeDocEntry(param, Kind.Parameter),
        defaultValue: getDefaultValue(param),
        type: resolveTypeString(param.type),
    });

    /** Visits each child that passes the filter condition (based on options). */
    private visitChildren<T>(
        children: Reflection[],
        visitor: (def: Reflection) => T,
        comparator?: (a: T, b: T) => number,
    ): T[] {
        const { excludeNames = [], includeNonExportedMembers = false } = this.options;
        return children
            .filter(ref => (ref.flags.isExported || includeNonExportedMembers) && isNotExcluded(excludeNames, ref.name))
            .map(visitor)
            .sort(comparator);
    }

    /**
     * Converts a typedoc comment object to a rendered `IBlock`.
     */
    private renderComment(comment: Comment) {
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

function getCommentTag(comment: Comment, tagName: string) {
    if (comment == null || comment.tags == null) {
        return undefined;
    }
    return comment.tags.find(tag => tag.tagName === tagName);
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

function getFileName({ sources = [] }: Reflection): string | undefined {
    const source = sources[0];
    const fileName = source && source.file && source.file.fullFileName;
    // filename relative to cwd, so it can be saved in a snapshot (machine-independent)
    return fileName && relative(process.cwd(), fileName);
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
