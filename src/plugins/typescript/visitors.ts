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
    Reflection,
    ReflectionKind,
    SignatureReflection,
} from "typedoc";
import { Comment } from "typedoc/dist/lib/models/comments/comment";
import { DefaultValueContainer } from "typedoc/dist/lib/models/reflections/abstract";
import {
    ITsClass,
    ITsInterface,
    ITsMethod,
    ITsMethodSignature,
    ITsParameter,
    ITsProperty,
    Kind,
} from "../../client/typescript";
import { ICompiler } from "../plugin";
import { resolveSignature, resolveTypeString } from "./typestring";

export type Renderer = ICompiler["renderBlock"];

export function visitorExportedClass(def: ContainerReflection, renderer: Renderer): ITsClass {
    return {
        ...visitorExportedInterface(def, renderer)!,
        kind: Kind.Class,
    };
}

export function visitorExportedInterface(def: ContainerReflection, renderer: Renderer): ITsInterface {
    return {
        documentation: renderComment(def.comment, renderer),
        fileName: getFileName(def),
        kind: Kind.Interface,
        methods: def
            .getChildrenByKind(ReflectionKind.Method)
            .filter(child => !isInternal(child, true))
            .map(method => visitorExportedMethod(method, renderer)),
        name: def.name,
        properties: def
            .getChildrenByKind(ReflectionKind.Property)
            .filter(child => !isInternal(child, true))
            .map(prop => visitorExportedProperty(prop, renderer)),
    };
}

function visitorExportedProperty(def: DeclarationReflection, renderer: Renderer): ITsProperty {
    return {
        defaultValue: getDefaultValue(def),
        documentation: renderComment(def.comment, renderer),
        fileName: getFileName(def),
        kind: Kind.Property,
        name: def.name,
        type: resolveTypeString(def.type),
    };
}

function visitorExportedMethod(def: DeclarationReflection, renderer: Renderer): ITsMethod {
    return {
        fileName: getFileName(def),
        kind: Kind.Method,
        name: def.name,
        signatures: def.signatures.map(sig => visitorSignature(sig, renderer)),
    };
}

function visitorSignature(sig: SignatureReflection, renderer: Renderer): ITsMethodSignature {
    return {
        documentation: renderComment(sig.comment, renderer),
        kind: Kind.Signature,
        parameters: sig.parameters.map(param => visitorParameter(param, renderer)),
        returnType: resolveTypeString(sig.type),
        type: resolveSignature(sig),
    };
}

function visitorParameter(param: ParameterReflection, renderer: Renderer): ITsParameter {
    return {
        defaultValue: getDefaultValue(param),
        documentation: renderComment(param.comment, renderer),
        fileName: getFileName(param.parent),
        flags: param.flags || {},
        kind: Kind.Parameter,
        name: param.name,
        type: resolveTypeString(param.type),
    };
}

/**
 * Converts a typedoc comment object to a rendered `IBlock`.
 */
function renderComment(comment: Comment, renderer: Renderer) {
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
    // TODO: only place compiler is needed
    return renderer(documentation);
}

function getDefaultValue(ref: DefaultValueContainer) {
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

function getFileName(ref: Reflection) {
    const [source] = ref.sources;
    const fileName = source && source.file && source.file.fullFileName;
    // filename relative to cwd, so it can be saved in a snapshot (machine-independent)
    return fileName && relative(process.cwd(), fileName);
}

/** Returns true if this reflection is not exported. Optionally considers private fields to also be internal. */
export function isInternal(ref: Reflection, includePrivate = false) {
    return ref.flags == null || !ref.flags.isExported || (includePrivate && ref.flags.isPrivate === true);
}
