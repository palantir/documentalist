# Documentalist [![CircleCI](https://circleci.com/gh/palantir/documentalist/tree/develop.svg?style=svg)](https://circleci.com/gh/palantir/workflows/documentalist)

[![npm](https://img.shields.io/npm/v/@documentalist/compiler.svg?label=@documentalist/compiler)](https://www.npmjs.com/package/@documentalist/compiler)
[![npm](https://img.shields.io/npm/v/@documentalist/client.svg?label=@documentalist/client)](https://www.npmjs.com/package/@documentalist/client)

> A sort-of-static site generator optimized for living documentation of software projects.

### Documentation

[See the full usage documentation here](https://palantir.github.io/documentalist/).

### Development

#### Prerequisites

- Yarn v1.x
- Node v18.x

#### Dev tasks

- `yarn build` compiles & builds source code
- `yarn lint` lints source code
- `yarn test` runs unit test suites
- `yarn deploy` pushes docs built in the `packages/docs/dist` folder to the `gh-pages` branch

#### Releases

_For maintainers only_:

[![Autorelease](https://img.shields.io/badge/Perform%20an-Autorelease-success.svg)](https://autorelease.general.dmz.palantir.tech/palantir/documentalist)
