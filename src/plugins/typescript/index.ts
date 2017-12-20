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

export interface ITypescriptPluginOptions {
    /** Exclude files by the given pattern when a path is provided as source. Supports standard minimatch patterns. */
    exclude?: string;
}

export class TypescriptPlugin implements IPlugin<ITypescriptPluginData> {
    private app: TypedocApp;
    public constructor(options: ITypescriptPluginOptions = {}) {
        this.app = new TypedocApp({ ignoreCompilerErrors: true, logger: "none", ...options });
    }

    public compile(files: IFile[], compiler: ICompiler): ITypescriptPluginData {
        const project = this.getTypedocProject(files.map(f => f.path));

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

    private getTypedocProject(files: string[]) {
        const expanded = this.app.expandInputFiles(files);
        return this.app.convert(expanded);
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
