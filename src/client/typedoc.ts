/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { IBlock } from "./index";

export interface ITsDocType {
    documentation?: IBlock;
    fileName: string;
    name: string;
    kind: string;
}

export interface ITsType extends ITsDocType {
    kind: "typealias";
}

export interface ITsVariableAlias extends ITsDocType {
    kind: "variable";
}

export interface ITsObjectMemberDefinition extends ITsDocType {
    optional?: boolean;
}

export interface ITsProperty extends ITsObjectMemberDefinition {
    kind: "property";
    type: string;
}

export interface ITsParameter extends ITsDocType {
    kind: "parameter";
    type: string;
    flags: any;
}

export interface ITsMethodSignature {
    kind: "signature";
    documentation?: IBlock;
    parameters: ITsParameter[];
    returnType: string;
    type: string;
}

export interface ITsMethod extends ITsObjectMemberDefinition {
    kind: "method";
    signatures: ITsMethodSignature[];
}

export interface ITsObjectDefinition extends ITsDocType {
    properties: ITsProperty[];
    methods: ITsMethod[];
}
export interface ITsInterface extends ITsObjectDefinition {
    kind: "interface";
    extends?: string[];
}

export interface ITsClass extends ITsObjectDefinition {
    kind: "class";
    extends?: string[];
    implements?: string[];
}

export interface ITypedocPluginData {
    typedoc: {
        [name: string]: ITsDocType;
    };
}
