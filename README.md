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
- `.css`, `.scss` files for comments on CSS selectors

```js
const { Documentalist } = require("documentalist");
const { writeFileSync } = require("fs");

const dm = new Documentalist();
const docs = dm.documentGlobs("src/**/*");

writeFileSync("docs.json", JSON.stringify(docs, null, 2));
```

# License

This project is made available under the [BSD License](https://github.com/palantir/documentalist/blob/master/LICENSE)
and includes a [Patent Grant](https://github.com/palantir/documentalist/blob/master/PATENTS).
