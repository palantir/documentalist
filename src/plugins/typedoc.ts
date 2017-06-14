/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

import * as Typedoc from "typedoc";
import { ITypedocPluginData, ITsClassEntry, ITsPropertyEntry } from "../client";
import { ICompiler, IFile, IPlugin } from "./plugin";

class TypedocApp extends Typedoc.Application {
    public fromFiles(files: string[]) {
        const expanded = this.expandInputFiles(files);
        const project = this.convert(expanded);
        return project.toObject();
    }

    // this tricks typedoc into working
    get isCLI(): boolean {
        return true;
    }
}

export class TypedocPlugin implements IPlugin<ITypedocPluginData> {
    public compile(files: IFile[], compiler: ICompiler) {
        const typedoc = new TypedocApp({logger: "none"}).fromFiles(files.map((f) => f.path));

        const classes: {[key: string]: ITsClassEntry} = {};
        this.visitKind(typedoc, "Class", (classDef: any) => {
            const name: string = classDef.name;

            let documentation = "";
            if (classDef && classDef.comment && classDef.comment.shortText) {
                documentation = classDef.comment.shortText;
            }

            const classEntry: ITsClassEntry = {
                documentation: this.renderComment(classDef, compiler),
                methods: [],
                name,
                properties: [],
                tags: {},
                type: "class",
            };

            this.visitKind(classDef, "Property", (def: any) => {
                const entry: ITsPropertyEntry = {
                    documentation: this.renderComment(def, compiler),
                    name: def.name,
                    tags: this.getTags(def),
                    // TODO this doesnt work for some types types. we need a
                    // conversion here to good formattable object
                    type: def.type.name,
                }
                classEntry.properties.push(entry);
            });

            this.visitKind(classDef, "Method", (def: any) => {
                const sig = (def && def.signatures && def.signatures[0]) ? def.signatures[0] : def;
                const entry: ITsPropertyEntry = {
                    documentation: this.renderComment(sig, compiler),
                    name: def.name,
                    tags: this.getTags(sig),
                    // TODO add type parameters here
                    type: "method",
                }
                classEntry.properties.push(entry);
            });

            classes[name] = classEntry;
        });

        return { typedoc: classes };
    }

    private getTags(obj: any) {
        return (obj && obj.tags) ? obj.tags : {};
    }

    /**
     * Converts a typedoc comment object to a rendered `IBlock`.
     */
    private renderComment(obj: any, { renderBlock }: ICompiler) {
        let documentation = "";
        if (obj && obj.comment && obj.comment.shortText) {
            documentation = obj.comment.shortText;
        }
        if (obj && obj.comment && obj.comment.text) {
            documentation += "\n\n" + obj.comment.text;
        }
        return renderBlock(documentation);
    }

    /**
     * Visit any object that has a matching `kindString`. Recursively test
     * children.
     */
    private visitKind(obj: any, kindString: string, visitor: (obj: any) => void) {
        if (!obj || typeof obj !== "object") {
            return;
        }

        if (obj.kindString === kindString) {
            visitor(obj);
        }

        if (Array.isArray(obj.children)) {
            for (const child of obj.children) {
                this.visitKind(child, kindString, visitor);
            }
        }
    }
}
