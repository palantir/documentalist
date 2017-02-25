# Documentalist

> A sort-of-static site generator optimized for living documentation of software projects.

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
and includes a [Patent Grant](https://github.com/palantir/documentalist/blob/master/PATENTS)
