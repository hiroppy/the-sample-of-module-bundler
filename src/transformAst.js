'use strict';

const { dirname } = require('path');
const { default: traverse } = require('@babel/traverse');
const t = require('@babel/types');
const { registerExportConfigTemplate } = require('./template');
const { parse } = require('./utils/parser');
const { getModule } = require('./utils/module');

const prefix = '__BUNDLER__';
const defaultExportName = '__default__';

// actually it's better to do this together with ID replacement, but this is a sample so I divided it here
function transformAst(entryDir, modulesMap) {
  for (const { id, ast, path: currentPath, type } of modulesMap.values()) {
    const exporters = {};

    // add __esModule flag to `exports` if a module is ESM
    if (type === 'esm') {
      ast.program.body.unshift(
        // add require.__addEsmFlag(exports) to body
        t.callExpression(t.identifier('require.__addEsmFlag'), [t.identifier('exports')])
      );
    }

    traverse(ast, {
      enter({ scope }) {
        scope.rename('module');
        scope.rename('exports');
        scope.rename('require');
        scope.rename('__dirname');
        scope.rename('__filename');
      },

      // replace variables used by external modules
      ReferencedIdentifier(path) {
        const localName = path.node.name;

        // TODO: need to optimize
        if (['require', 'module', 'exports'].includes(localName)) {
          return;
        }

        const localBinding = path.scope.getBinding(localName);

        if (!localBinding) {
          return;
        }

        const { parent } = localBinding.path;

        // ImportDeclaration: need to check strictly such as path.parentPath.isObjectProperty({ value: path.node }));
        if (!['ImportDeclaration'].includes(parent.type)) {
          return;
        }

        const parentSrcName = parent.source.value;
        const { id: parentModuleId, type: parentModuleType } = getModule(
          modulesMap,
          currentPath,
          parentSrcName,
          entryDir
        );
        let assignment;

        parent.specifiers.forEach(({ type, local, imported }) => {
          switch (type) {
            // import * as A from 'module'
            case 'ImportNamespaceSpecifier': {
              if (path.container.property) {
                if (path.container.property.name === 'default') {
                  // A.default -> __BUNDLER__{id}_DEFAULT.d
                  path.parentPath.replaceWith(t.identifier(`${prefix}${parentModuleId}_DEFAULT.d`));
                } else {
                  // A.foo -> __BUNDLER__{id}.foo
                  assignment = t.identifier(`${prefix}${parentModuleId}`);
                }
              } else {
                // A -> __BUNDLER__{id}
                assignment = t.identifier(`${prefix}${parentModuleId}`);
              }
              break;
            }
            // import A from 'module'
            case 'ImportDefaultSpecifier': {
              if (local.name === localName) {
                assignment = t.identifier(`${prefix}${parentModuleId}_DEFAULT.d`);
              }
              break;
            }
            /**
             * import { A } from 'module'
             * import { a as A } from 'module'
             * in this code, if a user uses CJS, only accepts import { default as A } from 'module'
             */
            case 'ImportSpecifier': {
              /**
               * check imported.name because ESM can rename a property name such as `a as A`
               * imported.name is original, and bundler deletes localName from source code
               */
              if (local.name === localName) {
                /**
                 * between CJS and ESM
                 * exporter: module.exports = require('module')
                 *           only accepts below syntax
                 * importer: import { default as A } from 'module'
                 */
                assignment = t.identifier(
                  `${prefix}${parentModuleId}${`[${JSON.stringify(imported.name)}]`}`
                );

                if (imported.name === 'default') {
                  assignment = t.identifier(`${prefix}${parentModuleId}_DEFAULT.d`);
                }
              }
              break;
            }
          }
        });

        if (assignment) {
          // __BUNDLER__{id}[function/variable name]
          // TODO: use replaceWithMultiple
          /**
           *  (0, __BUNDLER__{id}['name'])(args);
           *  path.parentPath.replaceWith(
           *    t.callExpression(
           *      t.sequenceExpression([t.numericLiteral(0), assignment]),
           *      path.node.arguments
           *    )
           *  );
           */
          path.replaceWith(assignment);
        }
      },
      ImportDeclaration(path) {
        /**
         * ImportDefaultSpecifier
         *   import default from 'module'
         *   import * as named from 'module'
         * ImportNamespaceSpecifier
         *   import { specified } from 'module'
         * ImportSpecifier
         *   import { default as b } from 'module';
         */
        const importSource = path.node.source.value;
        const { id: moduleId, type: moduleType } = getModule(
          modulesMap,
          currentPath,
          importSource,
          entryDir
        );

        // import 'module';
        if (path.node.specifiers.length === 0) {
          path.replaceWith(
            t.callExpression(t.identifier('require'), [t.stringLiteral(importSource)])
          );

          return;
        }

        const nodeType = path.node.specifiers[0].type;
        // for import { default as A } from 'module'
        const hasDefault =
          path.node.specifiers[0].imported && path.node.specifiers[0].imported.name === 'default';
        const valueName = `${prefix}${moduleId}`;

        path.replaceWith(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(valueName),
              // bundle can change the ID from require('module')
              t.callExpression(t.identifier('require'), [t.stringLiteral(importSource)])
            ),
          ])
        );

        /**
         * keep for compatibility between ESM and CJS
         * const __BUNDLER__1 = require(1);
         * const __BUNDLER__1__DEFAULT = require.__getDefaultExports(__BUNDLER__1);
         */
        if (
          nodeType === 'ImportNamespaceSpecifier' ||
          nodeType === 'ImportDefaultSpecifier' ||
          (nodeType === 'ImportSpecifier' && hasDefault)
        ) {
          path.insertAfter(
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier(`${valueName}_DEFAULT`),
                t.callExpression(t.identifier('require.__getDefaultExports'), [
                  t.identifier(valueName),
                ])
              ),
            ])
          );
        }
      },
      ExportDeclaration(path) {
        const { node } = path;
        const name =
          /* export default function a()*/ node.declaration.name ||
          /**
           * function a() {}
           * export default a;
           */ (node.declaration.id && node.declaration.id.name) ||
          /* export const a = 1*/ (node.declaration.declarations &&
            node.declaration.declarations[0].id.name);
        null;

        switch (path.type) {
          case 'ExportDefaultDeclaration': {
            switch (node.declaration.type) {
              // export default function a() {}
              case 'FunctionDeclaration': {
                // add a function name
                if (name == null) {
                  node.declaration.id = t.identifier(defaultExportName);
                  exporters['default'] = defaultExportName;
                } else {
                  exporters['default'] = name;
                }

                path.replaceWith(node.declaration); // remove `export` from `export function a() {}`
                break;
              }
              /**
               * const a = 1;
               * export default a;
               */
              case 'Identifier': {
                exporters['default'] = name;
                path.remove(); // remove `export default a`
                break;
              }
              // export default () => {}
              case 'ArrowFunctionExpression': {
                const assignment = t.variableDeclaration('const', [
                  t.variableDeclarator(t.identifier(defaultExportName), node.declaration),
                ]);

                exporters['default'] = defaultExportName;
                // replace `export default () => {}` with `const __default__ = () => {}`
                path.replaceWith(assignment);
                break;
              }
            }
            break;
          }
          case 'ExportNamedDeclaration': {
            const { node } = path;

            // TODO: add ID
            // if (name === null) {}

            exporters[name] = name;
            path.replaceWith(node.declaration);
            break;
          }
        }
      },
    });

    if (Object.keys(exporters).length !== 0) {
      const exportsTemplate = registerExportConfigTemplate(exporters);

      ast.program.body.push(parse(exportsTemplate));
    }
  }
}

module.exports = {
  transformAst: transformAst,
  prefix,
};
