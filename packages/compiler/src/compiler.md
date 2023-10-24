---
title: Compiler
---

@# Compiler

Register plugins with `.use(pattern, plugin)`. Supply a `pattern` to match files against; matched files will be compiled by the `plugin`. Documentation data will be collected into a single blob and can be easily written to a file or fed into another tool.

```js
const { Documentalist, MarkdownPlugin, TypescriptPlugin } = require("@documentalist/compiler");
const { writeFileSync } = require("fs");

new Documentalist()
    .use(".md", new MarkdownPlugin())
    .use(/\.tsx?$/, new TypescriptPlugin({ excludeNames: [/I.+State$/] }))
    .documentGlobs("src/**/*") // ← async operation, returns a Promise
    .then(docs => JSON.stringify(docs, null, 2))
    .then(json => writeFileSync("docs.json", json));
```

@interface Documentalist

## CLI

On the command line, the Markdown and Typescript plugins are enabled by default.
The CSS plugin can be enabled with `--css`. Plugins can be disabled with the `no-` prefix.

> **Options are not supported** via the command line interface :sob:.

```sh
documentalist "src/**/*" --css --no-ts > docs.json
```

## Plugins

Documentalist uses a plugin architecture to support arbitrary file types.
Use your own plugins by passing them to `dm.use(pattern, plugin)` with a
pattern to match against source files. The collected matched files will
be passed to your plugin's `compile` function, along with a `compiler`
instance that can be used to render blocks of markdown text.

@interface Plugin
