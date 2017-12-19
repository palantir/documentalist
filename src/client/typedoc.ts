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

export interface ITsDocType {
    documentation?: IBlock;
    fileName: string;
    name: string;
    kind: Kind;
}

export interface ITsObjectMemberDefinition extends ITsDocType {
    optional?: boolean;
}

export interface ITsProperty extends ITsObjectMemberDefinition {
    defaultValue?: string;
    kind: Kind.Property;
    type: string;
}

export interface ITsParameter extends ITsDocType {
    defaultValue?: string;
    kind: Kind.Parameter;
    type: string;
    flags: any;
}

export interface ITsMethodSignature {
    kind: Kind.Signature;
    documentation?: IBlock;
    parameters: ITsParameter[];
    returnType: string;
    type: string;
}

export interface ITsMethod extends ITsObjectMemberDefinition {
    kind: Kind.Method;
    signatures: ITsMethodSignature[];
}

export interface ITsObjectDefinition extends ITsDocType {
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

export type ITsDocEntity = ITsClass | ITsInterface | ITsMethod | ITsParameter | ITsProperty;

export interface ITypedocPluginData {
    typedoc: {
        [name: string]: ITsDocEntity;
    };
}
