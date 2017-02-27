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
```typescript
import * as Documentalist from "documentalist":
import { writeFileSync } from "fs";

const documentalist = new Documentalist();
const docs = documentalist.documentGlobs("src/**/*");
writeFileSync("docs.json", JSON.stringify(docs));
```

The documentalist object has the following API:

@interface IApi

### Plugins

Documentalist uses a plugin architecture to support arbitrary file types.



