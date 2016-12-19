# Documentalist

> A sort-of-static site generator optimized for living documentation of software projects.

## Documentalism 101

- documentation should live with code

## Usage

```ts
import Documentalist from "documentalist";
import * as glob from "glob";

const docs = new Documentalist();
docs.add(
  ...glob.sync("docs/*.md"),
  ...glob.sync("src/components/**/*.md"),
);

const data = {
    // a nested object of page refs denoting their layout.
    layout: doc.tree(BLUEPRINT_DIR),
    // a key-value store of all page data.
    // page data includes HTML contents, metadata object, and array of headings.
    pages: doc.read(),
};

writeFileSync("dist/data.json", JSON.stringify(data, null, 2));
```
