# The sample of Module Bundler

Introducing how to create a module bundler.

## Feature

You can see output codes [here](./tests/output).

| Implementation Contents                                                         | Output Code                                                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| CJS (`require`/`exports`/`module.exports`)                                      | [cjs/simple](./tests/output/cjs/simple/main.js)                                                              |
| circular dependency (CJS/ESM)                                                   | [cjs/circularDependency](./tests/output/cjs/circularDependency/main.js)                                      |
| node_modules with CJS                                                           | [cjs/node-modules](./tests/output/cjs/node-modules/main.js)                                                  |
| ESM                                                                             | [esm/simple](./tests/output/esm/simple/main.js), [esm/complication](./tests/output/esm/complication/main.js) |
| import `ImportDeclaration`                                                      | [esm/import](./tests/output/esm/import/main.js)                                                              |
| default `import`/`export` (`ImportDefaultSpecifier`,`ExportDefaultDeclaration`) | [esm/default](./tests/output/esm/default/main.js)                                                            |
| specifier `import`/`export`(`ImportSpecifier`, `ExportNamedDeclaration`)        | [esm/specifier](./tests/output/esm/specifier/main.js)                                                        |
| namespace specifier `import` (`ImportNamespaceSpecifier`)                       | [esm/namespaceSpecifier](./tests/output/esm/namespaceSpecifier/main.js)                                      |
| node_modules with ESM                                                           | [esm/node-modules](./tests/output/esm/node-modules/main.js)                                                  |
| interop between CJS and ESM                                                     | [common/interop](./tests/output/common/interop/main.js)                                                      |

## Build

```sh
$ npm i
$ npm test
$ cd tests/output # and you can see the output code
```
