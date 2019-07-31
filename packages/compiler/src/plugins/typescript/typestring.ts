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

import { SignatureReflection } from "typedoc";
import {
    IntersectionType,
    ReferenceType,
    ReflectionKind,
    ReflectionType,
    Type,
    UnionType,
} from "typedoc/dist/lib/models";

export function resolveTypeString(type: Type | undefined): string {
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
        return resolveReferenceName(type);
    } else if (type === undefined) {
        return "";
    } else {
        return type.toString();
    }
}

function resolveReferenceName(type: ReferenceType): string {
    if (type.name === "__type") {
        return "{}";
    } else if (
        type.reflection &&
        type.reflection.parent !== undefined &&
        type.reflection.kind === ReflectionKind.EnumMember
    ) {
        // include parent name in type string for easy identification
        return `${type.reflection.parent.name}.${type.name}`;
    } else if (type.typeArguments) {
        return `${type.name}<${type.typeArguments.map(resolveTypeString).join(", ")}>`;
    }
    return type.name;
}

export function resolveSignature(sig: SignatureReflection): string {
    const { parameters = [] } = sig;
    const paramList = parameters.map(param =>
        // "[...]name[?]: type"
        [
            param.flags.isRest ? "..." : "",
            param.name,
            param.flags.isOptional || param.defaultValue ? "?" : "",
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
