# Documentalist

**Documentalist** is a library for parsing documentation from **CSS**,
**Typescript**, and **Markdown** files. The output is a well-formed JSON object
that can be fed directly into any number of static site generators.

In fact, this documentation is made with **Documentalist** fed through a simple
**Pug** template.

### Command Line

Install
```bash
npm install documentalist
```

Create some documentation data:
```bash
documentalist 'src/**/*' > docs.json
```

### API

```typescript

// demo here

```

@interface IApi

### Plugins

Documentalist uses a plugin architecture to support arbitrary file types.
