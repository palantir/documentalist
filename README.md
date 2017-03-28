# Documentalist

> A sort-of-static site generator optimized for living documentation of software projects.

[![npm](https://img.shields.io/npm/v/documentalist.svg)](https://www.npmjs.com/package/documentalist)
[![CircleCI](https://circleci.com/gh/palantir/documentalist.svg?style=shield&circle-token=1dbd27fe833e64bafb3e8de8ee111a2aee9bb79d)](https://circleci.com/gh/palantir/documentalist)

## Documentalism 101

- documentation should live with code

## Usage

`Documentalist` comes pre-configured with support for the following languages:

- `.md` files for longform documentation and overall structure
- `.ts`, `.tsx` files for JSDoc comments on interfaces in TypeScript source code
- `.css`, `.less`, `.scss` files for comments on CSS selectors

With the JavaScript API, nothing comes for free. All plugins must be registered with `.use()`.

```js
const { Documentalist, MarkdownPlugin } = require("documentalist");
const { writeFileSync } = require("fs");

const docs = new Documentalist()
  .use(".md", new MarkdownPlugin())
  .documentGlobs("src/**/*");

writeFileSync("docs.json", JSON.stringify(docs, null, 2));
```

With the CLI, the Markdown and Typescript plugins are enabled by default.
The CSS plugin can be enabled with `--css`.

```sh
documentalist "src/**/*" --css --no-ts > docs.json
```

# License

This project is made available under the [BSD License](https://github.com/palantir/documentalist/blob/master/LICENSE)
and includes a [Patent Grant](https://github.com/palantir/documentalist/blob/master/PATENTS).
