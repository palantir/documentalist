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

import { IBlock } from "./compiler";

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
export interface ITsFlags {
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
export interface ITsDocBase<K extends Kind = Kind> {
    /** Type brand indicating kind of member; type guards will reveal further information about it. */
    kind: K;

    /** Compiled documentation: `contents` field contains an array of markdown strings or `@tag value` objects. */
    documentation?: IBlock;

    /** Original file name in which this member originated, relative to current working directory. */
    fileName?: string;

    flags?: ITsFlags;

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
 * @see ITsConstructor
 * @see ITsMethod
 */
export interface ITsCallable {
    /** Type name from which this method was inherited. Typically takes the form `Interface.member`. */
    inheritedFrom?: string;
    /** A method has at least one signature, which describes the parameters and return type and contains documentation. */
    signatures: ITsSignature[];
}

/** Re-usable interface for Typescript members that support a notion of "default value." */
export interface ITsDefaultValue {
    /** The default value of this property, from an initializer or an `@default` tag. */
    defaultValue?: string;
}

/** Re-usable interface for Typescript members that look like objects. */
export interface ITsObjectDefinition {
    /** List of type strings that this definition `extends`. */
    extends?: string[];
    /** List of type names that this definition `implements`. */
    implements?: string[];
    /** Index signature for this object, if declared. */
    indexSignature?: ITsSignature;
    /** Property members of this definition. */
    properties: ITsProperty[];
    /** Method members of this definiton. */
    methods: ITsMethod[];
}

/**
 * Documentation for a class constructor. See `signatures` array for actual callable signatures and rendered docs.
 * @see ITsClass
 */
export interface ITsConstructor extends ITsDocBase, ITsCallable {
    kind: Kind.Constructor;
}

export interface ITsAccessor extends ITsDocBase {
    kind: Kind.Accessor;
    /** If a set signature is defined and documented for this accessor, this will contain its documentation. */
    getDocumentation: IBlock | undefined;
    /** If a get signature is defined and documented for this accessor, this will contain its documentation. */
    setDocumentation: IBlock | undefined;
    /** Type of the accessor. */
    type: string;
}

/** Documentation for a method. See `signatures` array for actual callable signatures and rendered docs. */
export interface ITsMethod extends ITsDocBase, ITsCallable {
    kind: Kind.Method;
}

/**
 * Documentation for a single signature, including parameters, return type, and full type string.
 * Signatures are used for methods and constructors on classes or interfaces, and for index signatures on objects.
 */
export interface ITsSignature extends ITsDocBase {
    kind: Kind.Signature;
    /** Signatures do not have flags of their own. Flags can be found on the parent and on each parameter. */
    flags: undefined;
    /** Signature parameters, each with their own docs and data. */
    parameters: ITsParameter[];
    /** Return type of the signature. */
    returnType: string;
    /** Fully qualified type string describing this method, including parameters and return type. */
    type: string;
}

/** Documentation for a single parameter to a signature. */
export interface ITsParameter extends ITsDocBase, ITsDefaultValue {
    kind: Kind.Parameter;
    /** Fully qualified type string describing this parameter. */
    type: string;
    /** Parameters do not have their own URL; see the containing signature. */
    sourceUrl: undefined;
}

/** Documentation for a property of an object, which may have a default value. */
export interface ITsProperty extends ITsDocBase, ITsDefaultValue {
    kind: Kind.Property;
    /** Type name from which this property was inherited. Typically takes the form `Interface.member`. */
    inheritedFrom?: string;
    /** Type string describing this property. */
    type: string;
}

/** Documentation for an `interface` definition. */
export interface ITsInterface extends ITsDocBase, ITsObjectDefinition {
    kind: Kind.Interface;
}

/** Documentation for a `class` definition. */
export interface ITsClass extends ITsDocBase, ITsObjectDefinition {
    kind: Kind.Class;
    /** Constructor signature of this class. Note the special name here, as `constructor` is a JavaScript keyword. */
    constructorType: ITsConstructor;
    accessors: ITsAccessor[];
}
/** A member of an `enum` definition. An enum member will have a `defaultValue` if it was declared with an initializer. */
export interface ITsEnumMember extends ITsDocBase, ITsDefaultValue {
    kind: Kind.EnumMember;
}

/** Documentation for an `enum` definition. */
export interface ITsEnum extends ITsDocBase {
    kind: Kind.Enum;
    /** Enumeration members. */
    members: ITsEnumMember[];
}

/** A type alias, defined using `export type {name} = {type}.` The `type` property will contain the full type alias as a string. */
export interface ITsTypeAlias extends ITsDocBase {
    kind: Kind.TypeAlias;
    /** Type string for which this member is an alias. */
    type: string;
}

/**
 * The `TypescriptPlugin` exports a `typescript` key that contains a map of member name to
 * `class` or `interface` definition.
 *
 * Only classes and interfaces are provided at this root level, but each member contains full
 * information about its children, such as methods (and signatures and parameters) and properties.
 */
export interface ITypescriptPluginData {
    typescript: {
        [name: string]: ITsClass | ITsInterface | ITsEnum | ITsTypeAlias;
    };
}

function typeguard<T extends ITsDocBase>(kind: Kind) {
    return (data: any): data is T => data != null && (data as T).kind === kind;
}

// wooooo typeguards
export const isTsClass = typeguard<ITsClass>(Kind.Class);
export const isTsConstructor = typeguard<ITsConstructor>(Kind.Constructor);
export const isTsEnum = typeguard<ITsEnum>(Kind.Enum);
export const isTsEnumMember = typeguard<ITsEnumMember>(Kind.EnumMember);
export const isTsInterface = typeguard<ITsInterface>(Kind.Interface);
export const isTsMethod = typeguard<ITsMethod>(Kind.Method);
export const isTsParameter = typeguard<ITsParameter>(Kind.Parameter);
export const isTsProperty = typeguard<ITsProperty>(Kind.Property);
export const isTsSignature = typeguard<ITsSignature>(Kind.Signature);
export const isTsTypeAlias = typeguard<ITsTypeAlias>(Kind.TypeAlias);
