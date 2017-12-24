/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { SignatureReflection } from "typedoc";
import {
    IntersectionType,
    ReferenceType,
    ReflectionKind,
    ReflectionType,
    Type,
    UnionType,
} from "typedoc/dist/lib/models";

export function resolveTypeString(type: Type): string {
    if (type instanceof ReflectionType) {
        // reflection types include generics and object index signatures
        return type.declaration
            .getAllSignatures()
            .map(resolveSignature)
            .join(" | ");
    } else if (type instanceof UnionType) {
        return type.types.map(resolveTypeString).join(" | ");
    } else if (type instanceof IntersectionType) {
        return type.types.map(resolveTypeString).join(" & ");
    } else if (type instanceof ReferenceType) {
        const name = type.name === "__type" ? "{}" : type.name;
        const typeArgs = type.typeArguments == null ? "" : `<${type.typeArguments.map(resolveTypeString).join(", ")}>`;
        return name + typeArgs;
    } else {
        return type.toString();
    }
}

export function resolveSignature(sig: SignatureReflection): string {
    const { parameters = [] } = sig;
    const paramList = parameters.map(param =>
        // [...]name[?]: type
        [
            param.flags.isRest ? "..." : "",
            param.name,
            param.flags.isOptional ? "?" : "",
            ": ",
            resolveTypeString(param.type),
        ].join(""),
    );
    const returnType = resolveTypeString(sig.type);
    switch (sig.kind) {
        case ReflectionKind.CallSignature:
        case ReflectionKind.ConstructorSignature:
            return `(${paramList.join(", ")}) => ${returnType}`;
        case ReflectionKind.IndexSignature:
            return `{ [${paramList}]: ${returnType} }`;
        default:
            return sig.toString();
    }
}
