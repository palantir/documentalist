/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { IBlock } from "./index";

export enum Kind {
    Class = "class",
    Interface = "interface",
    Method = "method",
    Parameter = "parameter",
    Property = "property",
    Signature = "signature",
}

export interface ITsFlags {
    isPrivate?: boolean;
    isProtected?: boolean;
    isPublic?: boolean;
    isStatic?: boolean;
    isExported?: boolean;
    isExternal?: boolean;
    isOptional?: boolean;
    isRest?: boolean;
}

export interface ITsDocBase {
    /** Type brand indicating kind of entity; type guards will reveal further information about it. */
    kind: Kind;

    /** Compiled documentation: `contents` field contains an array of markdown strings or `@tag value` objects. */
    documentation?: IBlock;

    /** Original file name in which this entity originated. */
    fileName?: string;

    flags?: ITsFlags;

    /** Name of this entity in code, also used as its identifiers in the data store. */
    name: string;
}

export interface ITsObjectMemberDefinition extends ITsDocBase {
    /** Whether this member is optional. */
    optional?: boolean;
}

export interface ITsProperty extends ITsObjectMemberDefinition {
    kind: Kind.Property;

    /** The default value of this property, from an initializer or an `@default` tag. */
    defaultValue?: string;

    /** Type descriptor of this property. */
    type: string;
}

export interface ITsParameter extends ITsDocBase {
    kind: Kind.Parameter;

    /** The default value of this property, from an initializer or an `@default` tag. */
    defaultValue?: string;
    type: string;
    flags: any;
}

export interface ITsMethodSignature {
    kind: Kind.Signature;
    documentation?: IBlock;
    flags?: ITsFlags;
    parameters: ITsParameter[];
    returnType: string;
    type: string;
}

export interface ITsMethod extends ITsObjectMemberDefinition {
    kind: Kind.Method;
    /** A method has at least one signature, which describes the parameters and return type and contains documentation. */
    signatures: ITsMethodSignature[];
}

export interface ITsObjectDefinition extends ITsDocBase {
    properties: ITsProperty[];
    methods: ITsMethod[];
}

export interface ITsInterface extends ITsObjectDefinition {
    kind: Kind.Interface;
    extends?: string[];
}

export interface ITsClass extends ITsObjectDefinition {
    kind: Kind.Class;
    extends?: string[];
    implements?: string[];
}

export interface ITypescriptPluginData {
    typescript: {
        [name: string]: ITsClass | ITsInterface;
    };
}
