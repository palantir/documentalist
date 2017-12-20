/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { relative } from "path";
import {
    ContainerReflection,
    DeclarationReflection,
    ParameterReflection,
    ProjectReflection,
    Reflection,
    ReflectionKind,
    SignatureReflection,
} from "typedoc";
import { Comment } from "typedoc/dist/lib/models/comments/comment";
import { DefaultValueContainer, ReflectionFlags } from "typedoc/dist/lib/models/reflections/abstract";
import {
    ITsClass,
    ITsFlags,
    ITsInterface,
    ITsMethod,
    ITsMethodSignature,
    ITsParameter,
    ITsProperty,
    Kind,
} from "../../client/typescript";
import { ICompiler } from "../plugin";
import { ITypescriptPluginOptions } from "./index";
import { resolveSignature, resolveTypeString } from "./typestring";

export type Renderer = ICompiler["renderBlock"];

export class Visitor {
    public constructor(private compiler: ICompiler, private options: ITypescriptPluginOptions) {}

    public visitProject(project: ProjectReflection) {
        const interfaces = project
            .getReflectionsByKind(ReflectionKind.Interface)
            .filter(this.filterReflection)
            .map((face: ContainerReflection) => this.visitInterface(face));
        const classes = project
            .getReflectionsByKind(ReflectionKind.Class)
            .filter(this.filterReflection)
            .map((cls: ContainerReflection) => this.visitClass(cls));
        return [...interfaces, ...classes];
    }

    private visitClass(def: ContainerReflection): ITsClass {
        return {
            ...this.visitInterface(def),
            kind: Kind.Class,
        };
    }

    private visitInterface(def: ContainerReflection): ITsInterface {
        return {
            documentation: this.renderComment(def.comment),
            fileName: getFileName(def),
            flags: getFlags(def.flags),
            kind: Kind.Interface,
            methods: def
                .getChildrenByKind(ReflectionKind.Method)
                .filter(this.filterReflection)
                .map(method => this.visitMethod(method)),
            name: def.name,
            properties: def
                .getChildrenByKind(ReflectionKind.Property)
                .filter(this.filterReflection)
                .map(prop => this.visitProperty(prop)),
        };
    }

    private visitProperty(def: DeclarationReflection): ITsProperty {
        return {
            defaultValue: getDefaultValue(def),
            documentation: this.renderComment(def.comment),
            fileName: getFileName(def),
            flags: getFlags(def.flags),
            kind: Kind.Property,
            name: def.name,
            type: resolveTypeString(def.type),
        };
    }

    private visitMethod(def: DeclarationReflection): ITsMethod {
        return {
            fileName: getFileName(def),
            flags: getFlags(def.flags),
            kind: Kind.Method,
            name: def.name,
            signatures: def.signatures.map(sig => this.visitSignature(sig)),
        };
    }

    private visitSignature(sig: SignatureReflection): ITsMethodSignature {
        return {
            documentation: this.renderComment(sig.comment),
            flags: getFlags(sig.flags),
            kind: Kind.Signature,
            parameters: (sig.parameters || []).map(param => this.visitParameter(param)),
            returnType: resolveTypeString(sig.type),
            type: resolveSignature(sig),
        };
    }

    private visitParameter(param: ParameterReflection): ITsParameter {
        return {
            defaultValue: getDefaultValue(param),
            documentation: this.renderComment(param.comment),
            fileName: getFileName(param.parent),
            flags: getFlags(param.flags),
            kind: Kind.Parameter,
            name: param.name,
            type: resolveTypeString(param.type),
        };
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
            documentation += "\n\n" + comment.tags.map((tag: any) => `@${tag.tag} ${tag.text}`).join("\n");
        }
        return this.compiler.renderBlock(documentation);
    }

    private filterReflection = (def: Reflection) =>
        def.flags.isExported === true || this.options.includeNonExported === true;
}

function getDefaultValue(ref: DefaultValueContainer): string | undefined {
    if (ref.defaultValue) {
        return ref.defaultValue;
    } else if (ref.comment && ref.comment.tags) {
        const defaultValue = ref.comment.tags.find((t: any) => t.tag === "default");
        if (defaultValue !== undefined) {
            return defaultValue.text;
        }
    }
    return undefined;
}

function getFileName(ref: Reflection): string | undefined {
    const [source] = ref.sources;
    const fileName = source && source.file && source.file.fullFileName;
    // filename relative to cwd, so it can be saved in a snapshot (machine-independent)
    return fileName && relative(process.cwd(), fileName);
}

function getFlags(flags: ReflectionFlags | undefined): ITsFlags | undefined {
    if (flags === undefined) {
        return undefined;
    }
    const { isExported, isExternal, isOptional, isPrivate, isProtected, isPublic, isRest, isStatic } = flags;
    return { isExported, isExternal, isOptional, isPrivate, isProtected, isPublic, isRest, isStatic };
}
