---
title: Documentalist
---

# Overview

> A sort-of-static site generator optimized for living documentation of software projects.

[![npm](https://img.shields.io/npm/v/@documentalist/compiler.svg?label=@documentalist/compiler)](https://www.npmjs.com/package/@documentalist/compiler)
[![npm](https://img.shields.io/npm/v/@documentalist/client.svg?label=@documentalist/client)](https://www.npmjs.com/package/@documentalist/client)
[![CircleCI](https://circleci.com/gh/palantir/documentalist.svg?style=shield&circle-token=1dbd27fe833e64bafb3e8de8ee111a2aee9bb79d)](https://circleci.com/gh/palantir/documentalist)

## Documentalism 101

Documentalism is a two-step process:

1. Get the data.
2. Render the data.

The Documentalist compiler is an extensible solution to step 1: it helps you get all your data in one place, in a consistent format.
Configure Documentalist with plugins to extract documentation data from source files, then feed it a glob of files
and `await` your magical blob of documentation data!

## Packages

This project contains multiple NPM packages:

- [`@documentalist/compiler`](#compiler)
- [`@documentalist/client`](#client)

## License

This project is made available under the [Apache-2.0 License](https://github.com/palantir/documentalist/blob/develop/LICENSE).
