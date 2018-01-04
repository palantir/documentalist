/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
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
    Property = "property",
    Signature = "signature",
    TypeAlias = "type alias",
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
export interface ITsDocBase {
    /** Type brand indicating kind of member; type guards will reveal further information about it. */
    kind: Kind;

    /** Compiled documentation: `contents` field contains an array of markdown strings or `@tag value` objects. */
    documentation?: IBlock;

    /** Original file name in which this member originated. */
    fileName?: string;

    flags?: ITsFlags;

    /** Name of this member in code, also used as its identifiers in the data store. */
    name: string;
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
    signatures: ITsMethodSignature[];
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

/** Documentation for a method. See `signatures` array for actual callable signatures and rendered docs. */
export interface ITsMethod extends ITsDocBase, ITsCallable {
    kind: Kind.Method;
}

/** Documentation for a single method signature, including parameters, return type, and full type string. */
export interface ITsMethodSignature extends ITsDocBase {
    kind: Kind.Signature;
    /** Method signatures do not have flags of their own. Flags can be found on the method itself and on each parameter. */
    flags: undefined;
    /** Method parameters, each with their own docs and data. */
    parameters: ITsMethodParameter[];
    /** Return type of the method. */
    returnType: string;
    /** Fully qualified type string describing this method, including parameters and return type. */
    type: string;
}

/** Documentation for a single parameter to a method signature. */
export interface ITsMethodParameter extends ITsDocBase, ITsDefaultValue {
    kind: Kind.Parameter;
    /** Fully qualified type string describing this parameter. */
    type: string;
}

/** Documentation for a property of an object, which may have a default value. */
export interface ITsProperty extends ITsDocBase, ITsDefaultValue {
    kind: Kind.Property;
    /** Type name from which this property was inherited. Typically takes the form `Interface.member`. */
    inheritedFrom?: string;
    /** Type string describing of this property. */
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

export function isTsClass(data: any): data is ITsClass {
    return data != null && (data as ITsClass).kind === Kind.Class;
}

export function isTsEnum(data: any): data is ITsEnum {
    return data != null && (data as ITsEnum).kind === Kind.Enum;
}

export function isTsInterface(data: any): data is ITsInterface {
    return data != null && (data as ITsInterface).kind === Kind.Interface;
}

export function isTsTypeAlias(data: any): data is ITsTypeAlias {
    return data != null && (data as ITsTypeAlias).kind === Kind.TypeAlias;
}
