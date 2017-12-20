/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { SignatureReflection } from "typedoc";
import { IntersectionType, ReflectionKind, ReflectionType, Type, UnionType } from "typedoc/dist/lib/models";

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
    } else {
        return type.toString();
    }
}

export function resolveSignature(sig: SignatureReflection): string {
    const paramList = sig.parameters.map((param: any) => {
        const name = (param.flags && param.flags.isRest ? "..." : "") + param.name;
        const type = resolveTypeString(param.type);
        return `${name}: ${type}`;
    });
    const returnType = resolveTypeString(sig.type);
    if (sig.kind === ReflectionKind.CallSignature) {
        return `(${paramList.join(", ")}) => ${returnType}`;
    } else if (sig.kind === ReflectionKind.IndexSignature) {
        return `{ [${paramList}]: ${returnType} }`;
    }
    // TODO: more types
    return sig.toString();
}
