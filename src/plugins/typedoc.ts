/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import {
    Application,
    ContainerReflection,
    DeclarationReflection,
    ParameterReflection,
    Reflection,
    ReflectionKind,
    SignatureReflection,
} from "typedoc";
import {
    ITsClass,
    ITsDocType,
    ITsInterface,
    ITsMethod,
    ITsMethodSignature,
    ITsProperty,
    ITypedocPluginData,
} from "../client";
import { ICompiler, IFile, IPlugin } from "./plugin";

class TypedocApp extends Application {
    public static fromFiles(files: string[]) {
        const app = new TypedocApp({ logger: "none" });
        const expanded = app.expandInputFiles(files);
        const project = app.convert(expanded);
        return project.toObject();
    }

    // this tricks typedoc into working
    get isCLI(): boolean {
        return true;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class TypedocPlugin implements IPlugin<ITypedocPluginData> {
    // Store state so that we don't have to rely on scope closure to pass these
    // values around to visitors
    private compiler: ICompiler;
    private fileName: string;
    private output: { [key: string]: ITsDocType } = {};

    public compile(files: IFile[], compiler: ICompiler): ITypedocPluginData {
        this.compiler = compiler;
        this.output = {};
        const indexByName = (entry: ITsDocType) => (this.output[entry.name] = entry);

        const input = TypedocApp.fromFiles(files.map(f => f.path));
        this.visitKind(input, ReflectionKind.ExternalModule, def => {
            // TODO truncate beginning of path or use the sources object
            this.fileName = def.originalName;
            this.visitKind(def, ReflectionKind.Class, this.visitorExportedClass).forEach(indexByName);
            this.visitKind(def, ReflectionKind.Interface, this.visitorExportedInterface).forEach(indexByName);
        });

        const typedoc = this.output;
        delete this.compiler;
        delete this.output;
        return { typedoc };
    }

    private visitorExportedClass = (def: Reflection) => {
        if (isInternal(def)) {
            return;
        }

        const entry: ITsClass = {
            documentation: this.renderComment(def),
            fileName: this.fileName,
            kind: "class",
            methods: this.visitKind(def, ReflectionKind.Method, this.visitorExportedMethod),
            name: def.name,
            properties: this.visitKind(def, ReflectionKind.Property, this.visitorExportedProperty),
        };
        return entry;
    };

    private visitorExportedInterface = (def: Reflection) => {
        if (isInternal(def)) {
            return;
        }

        const entry: ITsInterface = {
            documentation: this.renderComment(def),
            fileName: this.fileName,
            kind: "interface",
            methods: this.visitKind(def, ReflectionKind.Method, this.visitorExportedMethod),
            name: def.name,
            properties: this.visitKind(def, ReflectionKind.Property, this.visitorExportedProperty),
        };
        return entry;
    };

    private visitorExportedProperty = (def: DeclarationReflection) => {
        if (isInternal(def, true)) {
            return;
        }

        const entry: ITsProperty = {
            documentation: this.renderComment(def),
            fileName: this.fileName,
            kind: "property",
            name: def.name,
            type: this.resolveTypeString(def.type),
        };
        return entry;
    };

    private visitorExportedMethod = (def: DeclarationReflection) => {
        if (isInternal(def, true)) {
            return;
        }

        const entry: ITsMethod = {
            fileName: this.fileName,
            kind: "method",
            name: def.name,
            signatures: def.signatures.map(this.visitorSignature),
        };
        return entry;
    };

    private visitorSignature = (sig: SignatureReflection): ITsMethodSignature => {
        const parameters =
            sig.parameters == null
                ? []
                : sig.parameters.map((param: ParameterReflection) => {
                      return {
                          documentation: this.renderComment(param),
                          fileName: this.fileName,
                          flags: param.flags || {},
                          kind: "parameter" as "parameter",
                          name: param.name,
                          type: this.resolveTypeString(param.type),
                      };
                  });
        const returnType = this.resolveTypeString(sig.type);
        return {
            documentation: this.renderComment(sig),
            kind: "signature" as "signature",
            parameters,
            returnType,
            type: this.resolveSignature(sig),
        };
    };

    private resolveTypeString = (type: any): string => {
        switch (type.type) {
            case "array":
                return this.resolveTypeString(type.elementType) + "[]";
            case "reflection":
                return this.resolveReflectionType(type.declaration);
            case "union":
                return type.types.map(this.resolveTypeString).join(" | ");
            case "intersection":
                return type.types.map(this.resolveTypeString).join(" & ");
            default:
                const name = type.name == null ? "?" : type.name;

                if (name === "__type") {
                    return "{}";
                }

                if (type.typeArguments) {
                    const typeArgs = type.typeArguments.map(this.resolveTypeString).join(", ");
                    return `${name}<${typeArgs}>`;
                }
                return name;
        }
    };

    private resolveReflectionType = (decl: any): string => {
        if (decl.signatures) {
            return decl.signatures.map(this.resolveSignature).join(" | ");
        }
        return "??";
    };

    private resolveSignature = (sig: any): string => {
        const paramList = !sig.parameters
            ? ""
            : sig.parameters
                  .map((param: any) => {
                      const name = (param.flags && param.flags.isRest ? "..." : "") + param.name;
                      const type = this.resolveTypeString(param.type);
                      return `${name}: ${type}`;
                  })
                  .join(", ");
        const returnType = this.resolveTypeString(sig.type);
        return `(${paramList}) => ${returnType}`;
    };

    /**
     * Converts a typedoc comment object to a rendered `IBlock`.
     */
    private renderComment = (obj: any) => {
        const { renderBlock } = this.compiler;
        if (!obj || !obj.comment) {
            return undefined;
        }

        const { comment } = obj;
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
        return renderBlock(documentation);
    };

    /**
     * Visit any object that has a matching `kind`. Recursively test
     * children.
     */
    private visitKind<T>(
        obj: Reflection,
        kind: ReflectionKind,
        visitor: (obj: Reflection) => T | undefined,
        results: T[] = [],
    ) {
        if (!obj || typeof obj !== "object") {
            return results;
        }

        if (obj.kind === kind) {
            const result = visitor(obj);
            if (result != null) {
                results.push(result);
            }
        }

        if (isContainer(obj)) {
            for (const child of obj.children) {
                this.visitKind(child, kind, visitor, results);
            }
        }

        return results;
    }
}

function isContainer(ref: Reflection): ref is ContainerReflection {
    return ref != null && Array.isArray((ref as ContainerReflection).children);
}

/** Returns true if this reflection is not exported. Optionally considers private fields to also be internal. */
function isInternal(ref: Reflection, includePrivate = false) {
    return !ref.flags || !ref.flags.isExported || (includePrivate && ref.flags.isPrivate);
}
