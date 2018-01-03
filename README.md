# Documentalist

> A sort-of-static site generator optimized for living documentation of software projects.

[![npm](https://img.shields.io/npm/v/documentalist.svg)](https://www.npmjs.com/package/documentalist)
[![CircleCI](https://circleci.com/gh/palantir/documentalist.svg?style=shield&circle-token=1dbd27fe833e64bafb3e8de8ee111a2aee9bb79d)](https://circleci.com/gh/palantir/documentalist)

## Documentalism 101

Documentalism is a two-step process:

1. Get the data.
2. Render the data.

`Documentalist` is an extensible solution to step 1: it helps you get all your data in one place, in a consistent format.
Configure `Documentalist` with plugins to extract documentation data from source files, then feed it a glob of files
and `await` your magical blob of documentation data!

## 1. Get the data

`Documentalist` comes with plugins for the following languages:

- __Markdown__ &mdash; longform documentation and overall structure.
- __TypeScript__ &mdash; JSDoc comments in TypeScript source code.
- __Stylesheets__ &mdash; KSS examples for HTML markup and CSS modifiers.

### Node

Register plugins with `.use(pattern, plugin)`. Supply a `pattern` to match files against; matched files will be compiled by the `plugin`. Documentation data will be collected into a single blob and can be easily written to a file or fed into another tool.

```js
const { Documentalist, MarkdownPlugin, TypescriptPlugin } = require("documentalist");
const { writeFileSync } = require("fs");

new Documentalist()
  .use(".md", new MarkdownPlugin())
  .use(/\.tsx?$/, new TypescriptPlugin({ excludeNames: [/I.+State$/] }))
  .documentGlobs("src/**/*") // ← async operation, returns a Promise
  .then(docs => JSON.stringify(docs, null, 2))
  .then(json => writeFileSync("docs.json", json))
```

### CLI

On the command line, the Markdown and Typescript plugins are enabled by default.
The CSS plugin can be enabled with `--css`. Plugins can be disabled with the `no-` prefix.

> __Options are not supported__ via the command line interface :sob:.

```sh
documentalist "src/**/*" --css --no-ts > docs.json
```

### Plugins

Documentalist uses a plugin architecture to support arbitrary file types.
Use your own plugins by passing them to `dm.use(pattern, plugin)` with a
pattern to match against source files. The collected matched files will
be passed to your plugin's `compile` function, along with a `compiler`
instance that can be used to render blocks of markdown text.

## 2. Render the data

Now that you've got a sweet data file packed with documentation goodness, what next?

Well, you've got some options. This package does not provide the tools to render the data, but they're fairly easy to construct once you understand the data format.

- Check out the [`theme/`](https://github.com/palantir/documentalist/tree/master/theme) directory here for our simple Pug template that renders the [GitHub Pages site](http://palantir.github.io/documentalist).
- Blueprint publishes a React theme in the [`@blueprintjs/docs-theme`](https://www.npmjs.com/package/@blueprintjs/docs) package (the same one that powers http://blueprintjs.com/docs).

## License

This project is made available under the [BSD License](https://github.com/palantir/documentalist/blob/master/LICENSE)
and includes a [Patent Grant](https://github.com/palantir/documentalist/blob/master/PATENTS).
