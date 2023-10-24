## Changelog

### 2022-04-05

`@documentalist/compiler@4.0.0`

-   [#144](https://github.com/palantir/documentalist/pull/144) :warning: break: Minimum version of Node.js is now v12.0
    -   N.B. Node v16.x is recommended
-   [#144](https://github.com/palantir/documentalist/pull/144) :warning: break(`TypescriptPlugin`): `includeNonExportedMembers` option has been removed. TypeDoc is removing support for documenting non-exported members in a future version, so we will have to drop support for this in Documentalist as well.
-   [#144](https://github.com/palantir/documentalist/pull/144) fix(`NpmPlugin`): simplified the plugin to have synchronous execution (replaced `spawn` with `spawnSync`), improving its compatibility with newer versions of Node.js

`@documentalist/client@4.0.0`

-   [#144](https://github.com/palantir/documentalist/pull/144) :warning: break: Minimum version of Node.js is now v12.0
    -   N.B. Node v16.x is recommended

### 2020-10-05

`@documentalist/compiler@3.0.0`

-   :warning: Minimum version of Node.js is now v10.0
-   :warning: Minimum version of TypeScript is now v3.9
-   [#119](https://github.com/palantir/documentalist/pull/119) upgrade dependencies
    -   typedoc v0.19
    -   typescript v4.0
    -   marked v1.2
    -   kss v3.0

`@documentalist/client@3.0.0`

-   Minimum version of Node.js is now v10.0

### 2020-08-17

`@documentalist/compiler@2.9.0`

-   [#113](https://github.com/palantir/documentalist/pull/109) chore(deps): upgrade typedoc to 0.18.0
-   [#109](https://github.com/palantir/documentalist/pull/109) chore(deps): upgrade marked to v0.8

### 2020-04-15

`@documentalist/compiler@2.8.1`

-   [#106](https://github.com/palantir/documentalist/pull/106) fix: NOENT error on win platform

`@documentalist/client@2.5.0`, `@documentalist/compiler@2.8.0`, `@documentalist/docs@2.8.0`

-   [#107](https://github.com/palantir/documentalist/pull/107) feat: upgrade to TypeScript 3.8

### 2020-02-20

`@documentalist/client@2.4.0`, `@documentalist/compiler@2.7.0`, `@documentalist/docs@2.7.0`

-   [#104](https://github.com/palantir/documentalist/pull/104) feat: add support for extracting function docs

### 2020-01-14

`@documentalist/compiler@2.6.0`, `@documentalist/docs@2.6.0`

-   [#103](https://github.com/palantir/documentalist/pull/103) feat: upgrade to TypeDoc 0.16
