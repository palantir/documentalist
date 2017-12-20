/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import { Application, ContainerReflection, ReflectionKind } from "typedoc";
import { ITypescriptPluginData } from "../../client";
import { ICompiler, IFile, IPlugin } from "../plugin";
import { isInternal, visitorExportedClass, visitorExportedInterface } from "./visitors";

export class TypescriptPlugin implements IPlugin<ITypescriptPluginData> {
    public compile(files: IFile[], compiler: ICompiler): ITypescriptPluginData {
        const project = typedocFiles(files.map(f => f.path));

        const interfaces = project
            .getReflectionsByKind(ReflectionKind.Interface)
            .filter(filterInternal)
            .map((ref: ContainerReflection) => visitorExportedInterface(ref, compiler.renderBlock));
        const classes = project
            .getReflectionsByKind(ReflectionKind.Class)
            .filter(filterInternal)
            .map((ref: ContainerReflection) => visitorExportedClass(ref, compiler.renderBlock));

        const typescript = compiler.objectify([...interfaces, ...classes], i => i.name);
        return { typescript };
    }
}

const filterInternal = (ref: ContainerReflection) => !isInternal(ref);

// tslint:disable-next-line:max-classes-per-file
class TypedocApp extends Application {
    // this tricks typedoc into working
    get isCLI() {
        return true;
    }
}

function typedocFiles(files: string[]) {
    const app = new TypedocApp({ ignoreCompilerErrors: true, logger: "none" });
    const expanded = app.expandInputFiles(files);
    return app.convert(expanded);
}
