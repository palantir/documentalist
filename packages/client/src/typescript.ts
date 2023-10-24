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

import { Block } from "./compiler";

/** Enumeration describing the various kinds of member supported by this plugin. */
export enum Kind {
    Class = "class",
    Constructor = "constructor",
    Enum = "enum",
    EnumMember = "enum member",
    Interface = "interface",
    Method = "method",
    Parameter = "parameter",
    Signature = "signature",
    Property = "property",
    TypeAlias = "type alias",
    Accessor = "accessor",
}

/** Compiler flags about this member. */
export interface TsFlags {
    /** This flag supports an optional message, typically used to include a version number. */
    isDeprecated?: boolean | string;
    isExported?: boolean;
    isExternal?: boolean;
    isOptional?: boolean;
    isPrivate?: boolean;
    isProtected?: boolean;
    isPublic?: boolean;
    isRest?: boolean;
    isStatic?: boolean;
}

/** Base type for all typescript documentation members. */
export interface TsDocBase<K extends Kind = Kind> {
    /** Type brand indicating kind of member; type guards will reveal further information about it. */
    kind: K;

    /** Compiled documentation: `contents` field contains an array of markdown strings or `@tag value` objects. */
    documentation?: Block;

    /** Original file name in which this member originated, relative to current working directory. */
    fileName?: string;

    flags?: TsFlags;

    /** Name of this member in code, also used as its identifiers in the data store. */
    name: string;

    /**
     * Absolute URL pointing to source file in repository, including line number.
     * If `gitBranch` option is provided to the `TypescriptPlugin`, the URL will reference that branch.
     * Otherwise, it will reference the current commit hash.
     * @see ITypescriptPluginOptions.gitBranch
     */
    sourceUrl?: string;
}

/**
 * Common type for a callable member, something that can be invoked.
 * @see TsConstructor
 * @see TsMethod
 */
export interface TsCallable {
    /** Type name from which this method was inherited. Typically takes the form `Interface.member`. */
    inheritedFrom?: string;
    /** A method has at least one signature, which describes the parameters and return type and contains documentation. */
    signatures: TsSignature[];
}

/** Re-usable interface for Typescript members that support a notion of "default value." */
export interface TsDefaultValue {
    /** The default value of this property, from an initializer or an `@default` tag. */
    defaultValue?: string;
}

/** Re-usable interface for Typescript members that look like objects. */
export interface TsObjectDefinition {
    /** List of type strings that this definition `extends`. */
    extends?: string[];
    /** List of type names that this definition `implements`. */
    implements?: string[];
    /** Index signature for this object, if declared. */
    indexSignature?: TsSignature;
    /** Property members of this definition. */
    properties: TsProperty[];
    /** Method members of this definiton. */
    methods: TsMethod[];
}

/**
 * Documentation for a class constructor. See `signatures` array for actual callable signatures and rendered docs.
 * @see TsClass
 */
export interface TsConstructor extends TsDocBase, TsCallable {
    kind: Kind.Constructor;
}

export interface TsAccessor extends TsDocBase {
    kind: Kind.Accessor;
    /** If a set signature is defined and documented for this accessor, this will contain its documentation. */
    getDocumentation: Block | undefined;
    /** If a get signature is defined and documented for this accessor, this will contain its documentation. */
    setDocumentation: Block | undefined;
    /** Type of the accessor. */
    type: string;
}

/** Documentation for a method. See `signatures` array for actual callable signatures and rendered docs. */
export interface TsMethod extends TsDocBase, TsCallable {
    kind: Kind.Method;
}

/**
 * Documentation for a single signature, including parameters, return type, and full type string.
 * Signatures are used for methods and constructors on classes or interfaces, and for index signatures on objects.
 */
export interface TsSignature extends TsDocBase {
    kind: Kind.Signature;
    /** Signatures do not have flags of their own. Flags can be found on the parent and on each parameter. */
    flags: undefined;
    /** Signature parameters, each with their own docs and data. */
    parameters: TsParameter[];
    /** Return type of the signature. */
    returnType: string;
    /** Fully qualified type string describing this method, including parameters and return type. */
    type: string;
}

/** Documentation for a single parameter to a signature. */
export interface TsParameter extends TsDocBase, TsDefaultValue {
    kind: Kind.Parameter;
    /** Fully qualified type string describing this parameter. */
    type: string;
    /** Parameters do not have their own URL; see the containing signature. */
    sourceUrl: undefined;
}

/** Documentation for a property of an object, which may have a default value. */
export interface TsProperty extends TsDocBase, TsDefaultValue {
    kind: Kind.Property;
    /** Type name from which this property was inherited. Typically takes the form `Interface.member`. */
    inheritedFrom?: string;
    /** Type string describing this property. */
    type: string;
}

/** Documentation for an `interface` definition. */
export interface TsInterface extends TsDocBase, TsObjectDefinition {
    kind: Kind.Interface;
}

/** Documentation for a `class` definition. */
export interface TsClass extends TsDocBase, TsObjectDefinition {
    kind: Kind.Class;
    /** Constructor signature of this class. Note the special name here, as `constructor` is a JavaScript keyword. */
    constructorType: TsConstructor;
    accessors: TsAccessor[];
}
/** A member of an `enum` definition. An enum member will have a `defaultValue` if it was declared with an initializer. */
export interface TsEnumMember extends TsDocBase, TsDefaultValue {
    kind: Kind.EnumMember;
}

/** Documentation for an `enum` definition. */
export interface TsEnum extends TsDocBase {
    kind: Kind.Enum;
    /** Enumeration members. */
    members: TsEnumMember[];
}

/** A type alias, defined using `export type {name} = {type}.` The `type` property will contain the full type alias as a string. */
export interface TsTypeAlias extends TsDocBase {
    kind: Kind.TypeAlias;
    /** Type string for which this member is an alias. */
    type: string;
}

export type TsDocEntry = TsClass | TsInterface | TsEnum | TsMethod | TsTypeAlias;

/**
 * The `TypescriptPlugin` exports a `typescript` key that contains a map of member name to
 * `class` or `interface` definition.
 *
 * Only classes and interfaces are provided at this root level, but each member contains full
 * information about its children, such as methods (and signatures and parameters) and properties.
 */
export interface TypescriptPluginData {
    typescript: {
        [name: string]: TsDocEntry;
    };
}

function typeguard<T extends TsDocBase>(kind: Kind) {
    return (data: any): data is T => data != null && (data as T).kind === kind;
}

export const isTsClass = typeguard<TsClass>(Kind.Class);
export const isTsConstructor = typeguard<TsConstructor>(Kind.Constructor);
export const isTsEnum = typeguard<TsEnum>(Kind.Enum);
export const isTsEnumMember = typeguard<TsEnumMember>(Kind.EnumMember);
export const isTsInterface = typeguard<TsInterface>(Kind.Interface);
export const isTsMethod = typeguard<TsMethod>(Kind.Method);
export const isTsParameter = typeguard<TsParameter>(Kind.Parameter);
export const isTsProperty = typeguard<TsProperty>(Kind.Property);
export const isTsSignature = typeguard<TsSignature>(Kind.Signature);
export const isTsTypeAlias = typeguard<TsTypeAlias>(Kind.TypeAlias);
