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
    Compiler,
    Kind,
    TsAccessor,
    TsClass,
    TsConstructor,
    TsDocBase,
    TsEnum,
    TsEnumMember,
    TsFlags,
    TsInterface,
    TsMethod,
    TsParameter,
    TsProperty,
    TsSignature,
    TsTypeAlias,
} from "@documentalist/client";
import { relative } from "node:path";
import {
    Comment,
    DeclarationReflection,
    ParameterReflection,
    ProjectReflection,
    Reflection,
    ReflectionKind,
    SignatureReflection,
} from "typedoc";

import { TypescriptPluginOptions } from "./typescriptPlugin";
import { resolveSignature, resolveTypeString } from "./typestring";

export class Visitor {
    public constructor(
        private compiler: Compiler,
        private options: TypescriptPluginOptions,
    ) {}

    public async visitProject(project: ProjectReflection) {
        const { excludePaths = [] } = this.options;
        // get top-level members of typedoc project
        return [
            ...(await this.visitChildren(project.getReflectionsByKind(ReflectionKind.Class), this.visitClass)),
            ...(await this.visitChildren(project.getReflectionsByKind(ReflectionKind.Enum), this.visitEnum)),
            ...(await this.visitChildren(project.getReflectionsByKind(ReflectionKind.Function), this.visitMethod)),
            ...(await this.visitChildren(project.getReflectionsByKind(ReflectionKind.Interface), this.visitInterface)),
            ...(await this.visitChildren<TsTypeAlias>(
                project.getReflectionsByKind(ReflectionKind.TypeAlias),
                async def => ({
                    ...(await this.makeDocEntry(def, Kind.TypeAlias)),
                    type: resolveTypeString(def.type),
                }),
            )),
        ].filter(
            // remove members excluded by path option
            ref => isNotExcluded(excludePaths, ref.fileName),
        );
    }

    private async makeDocEntry<K extends Kind>(ref: Reflection, kind: K): Promise<TsDocBase<K>> {
        let comment = ref.comment;

        if (comment === undefined && ref.isDeclaration()) {
            // special case for interface properties which have function signatures - we need to go one level deeper
            // to access the comment
            ref.type?.visit({
                reflection: reflectionType => {
                    if (reflectionType.declaration.signatures !== undefined) {
                        comment = reflectionType.declaration.signatures[0].comment;
                    }
                },
            });
        }

        return {
            documentation: await this.renderComment(comment),
            fileName: getSourceFileName(ref),
            flags: getFlags(ref),
            kind,
            name: ref.name,
            sourceUrl: getSourceUrl(ref),
        };
    }

    private visitClass = async (def: DeclarationReflection): Promise<TsClass> => ({
        ...(await this.visitInterface(def)),
        accessors: await this.visitChildren(def.getChildrenByKind(ReflectionKind.Accessor), this.visitAccessor),
        constructorType: (
            await this.visitChildren(def.getChildrenByKind(ReflectionKind.Constructor), this.visitConstructor)
        )[0],
        kind: Kind.Class,
    });

    private visitInterface = async (def: DeclarationReflection): Promise<TsInterface> => ({
        ...(await this.makeDocEntry(def, Kind.Interface)),
        extends: def.extendedTypes?.map(resolveTypeString),
        implements: def.implementedTypes?.map(resolveTypeString),
        indexSignature: def.indexSignature && (await this.visitSignature(def.indexSignature)),
        methods: await this.visitChildren(
            def.getChildrenByKind(ReflectionKind.Method),
            this.visitMethod,
            sortStaticFirst,
        ),
        properties: await this.visitChildren(
            def.getChildrenByKind(ReflectionKind.Property),
            this.visitProperty,
            sortStaticFirst,
        ),
    });

    private visitConstructor = async (def: DeclarationReflection): Promise<TsConstructor> => ({
        ...(await this.visitMethod(def)),
        kind: Kind.Constructor,
    });

    private visitEnum = async (def: DeclarationReflection): Promise<TsEnum> => ({
        ...(await this.makeDocEntry(def, Kind.Enum)),
        members: await this.visitChildren<TsEnumMember>(def.getChildrenByKind(ReflectionKind.EnumMember), async m => ({
            ...(await this.makeDocEntry(m, Kind.EnumMember)),
            defaultValue: getDefaultValue(m),
        })),
    });

    private visitProperty = async (def: DeclarationReflection): Promise<TsProperty> => ({
        ...(await this.makeDocEntry(def, Kind.Property)),
        defaultValue: getDefaultValue(def),
        inheritedFrom: def.inheritedFrom && resolveTypeString(def.inheritedFrom),
        type: resolveTypeString(def.type),
    });

    private visitMethod = async (def: DeclarationReflection): Promise<TsMethod> => ({
        ...(await this.makeDocEntry(def, Kind.Method)),
        inheritedFrom: def.inheritedFrom && resolveTypeString(def.inheritedFrom),
        signatures: await Promise.all((def.signatures ?? []).map(sig => this.visitSignature(sig))),
    });

    private visitSignature = async (sig: SignatureReflection): Promise<TsSignature> => ({
        ...(await this.makeDocEntry(sig, Kind.Signature)),
        flags: undefined,
        parameters: await Promise.all((sig.parameters || []).map(param => this.visitParameter(param))),
        returnType: resolveTypeString(sig.type),
        type: resolveSignature(sig),
    });

    private visitParameter = async (param: ParameterReflection): Promise<TsParameter> => ({
        ...(await this.makeDocEntry(param, Kind.Parameter)),
        defaultValue: getDefaultValue(param),
        sourceUrl: undefined,
        type: resolveTypeString(param.type),
    });

    private visitAccessor = async (param: DeclarationReflection): Promise<TsAccessor> => {
        let type: string;
        let getDocumentation;
        let setDocumentation;

        if (param.getSignature) {
            type = resolveTypeString(param.getSignature.type);
        } else if (param.setSignature?.parameters && param.setSignature?.parameters[0] !== undefined) {
            type = resolveTypeString(param.setSignature.parameters[0].type);
        } else {
            throw Error("Accessor did neither define get nor set signature.");
        }

        if (param.getSignature) {
            getDocumentation = await this.renderComment(param.getSignature.comment);
        }
        if (param.setSignature) {
            setDocumentation = await this.renderComment(param.setSignature.comment);
        }

        return {
            ...(await this.makeDocEntry(param, Kind.Accessor)),
            getDocumentation,
            setDocumentation,
            type,
        };
    };

    /** Visits each child that passes the filter condition (based on options). */
    private async visitChildren<T extends TsDocBase>(
        children: Reflection[],
        visitor: (def: DeclarationReflection) => T | Promise<T>,
        comparator?: (a: T, b: T) => number,
    ): Promise<T[]> {
        const { excludeNames = [], excludePaths = [] } = this.options;
        const visited = await Promise.all(children.map(visitor));
        return visited
            .filter(doc => isNotExcluded(excludeNames, doc.name) && isNotExcluded(excludePaths, doc.fileName))
            .sort(comparator);
    }

    /**
     * Converts a typedoc comment object to a rendered `Block`.
     */
    private renderComment(comment: Comment | undefined) {
        if (comment === undefined) {
            return;
        }

        let documentation = "";
        documentation += comment.summary.map(part => part.text).join("\n");

        const blockTags = comment.blockTags.filter(tag => tag.tag !== "@default" && tag.tag !== "@deprecated");
        if (blockTags.length > 0) {
            documentation += "\n\n";
            documentation += blockTags.map(tag => `${tag.tag} ${tag.content}`).join("\n");
        }

        return this.compiler.renderBlock(documentation);
    }
}

function getCommentTagValue(comment: Comment | undefined, tagName: string) {
    const maybeTag = comment?.getTag(`@${tagName}`);
    return maybeTag?.content.map(part => part.text.trim()).join("\n");
}

function getDefaultValue(ref: ParameterReflection | DeclarationReflection): string | undefined {
    // N.B. TypeDoc no longer sets defaultValue for enum members as of v0.23, see https://typedoc.org/guides/changelog/#v0.23.0-(2022-06-26)
    // Also, we typically expect enum member values to only have literal types, so we can just use the type value.
    if (ref.kind === ReflectionKind.EnumMember && ref.type?.type === "literal") {
        return ref.type?.value?.toString();
    }

    return ref.defaultValue ?? getCommentTagValue(ref.comment, "default");
}

function getSourceFileName(reflection: Reflection): string | undefined {
    if (reflection.isDeclaration() || isSignatureReflection(reflection)) {
        if (reflection.sources !== undefined) {
            const { fullFileName } = reflection.sources[0];
            // fullFileName relative to cwd, so it can be saved in a snapshot (machine-independent)
            return fullFileName && relative(process.cwd(), fullFileName);
        }
    }
    return undefined;
}

function isSignatureReflection(reflection: Reflection): reflection is SignatureReflection {
    return reflection.variant === "signature";
}

function getSourceUrl(reflection: Reflection): string | undefined {
    if (reflection.isDeclaration() || isSignatureReflection(reflection)) {
        if (reflection.sources !== undefined) {
            return reflection.sources[0]?.url;
        }
    }
    return undefined;
}

function getFlags(ref: Reflection): TsFlags | undefined {
    if (ref === undefined || ref.flags === undefined) {
        return undefined;
    }
    const isDeprecated = getIsDeprecated(ref);
    const { isExternal, isOptional, isPrivate, isProtected, isPublic, isRest, isStatic } = ref.flags;
    return {
        isDeprecated,
        isExternal,
        isOptional,
        isPrivate,
        isProtected,
        isPublic,
        isRest,
        isStatic,
    };
}

function getIsDeprecated(ref: Reflection) {
    const deprecatedTagValue = getCommentTagValue(ref.comment, "deprecated");
    const deprecatedModifier = ref.comment?.hasModifier("@deprecated");
    return deprecatedModifier || deprecatedTagValue !== undefined;
}

/** Returns true if value does not match all patterns. */
function isNotExcluded(patterns: Array<string | RegExp>, value?: string) {
    return value === undefined || patterns.every(p => value.match(p) == null);
}

/** Sorts static members (`flags.isStatic`) before non-static members. */
function sortStaticFirst<T extends TsDocBase>({ flags: aFlags = {} }: T, { flags: bFlags = {} }: T) {
    if (aFlags.isStatic && bFlags.isStatic) {
        return 0;
    } else if (aFlags.isStatic) {
        return -1;
    } else if (bFlags.isStatic) {
        return 1;
    }
    return 0;
}
