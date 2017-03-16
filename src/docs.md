---
title: Documentalist
---

## Documentalist

**Documentalist** is a library for parsing documentation from **CSS**,
**Typescript**, and **Markdown** files. The output is a well-formed JSON object
that can be fed directly into any number of static site generators.

In fact, this documentation is made by feeding **Documentalist**'s source
through itself and then rendering the output with a simple **Pug** template.
Docception.

### Command Line

Install:
```bash
npm install documentalist
```

Create some documentation data:
```bash
documentalist 'src/**/*' > docs.json
```

### API

Of course, you can also use **Documentalist** in a Node.js environment like so:

```js
const { Documentalist } = require("documentalist");
const { writeFileSync } = require("fs");

const dm = Documentalist.create();
const docs = dm.documentGlobs("src/**/*");

writeFileSync("docs.json", JSON.stringify(docs, null, 2));
```

The documentalist object has the following API:

@interface IApi

### Plugins

Documentalist uses a plugin architecture to support arbitrary file types.



