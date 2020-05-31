'use strict';

const { dirname } = require('path');
const { default: traverse } = require('@babel/traverse');
const t = require('@babel/types');
const { registerExportConfigTemplate } = require('./template');
const { parse } = require('./utils/parser');
const { getModuleId } = require('./utils/module');

const prefix = '__BUNDLER__';
const defaultExportName = '__default__';

// actually it's better to do this together with ID replacement, but this is a sample so I divided it here
function transformToCjs(entryDir, modulesMap) {
  for (const { id, ast, path: currentPath } of modulesMap.values()) {
    const exporters = {};

    traverse(ast, {
      enter({ scope }) {
        scope.rename('module');
        scope.rename('exports');
        scope.rename('require');
        scope.rename('__dirname');
        scope.rename('__filename');
      },

      // replace variables which used by external modules
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
        let name;
        let isImportNamespaceSpecifier = false;

        // need to check strictly such as path.parentPath.isObjectProperty({ value: path.node }));
        if (parent.type === 'ImportDeclaration') {
          parent.specifiers.forEach(({ type, local, imported }) => {
            switch (type) {
              case 'ImportNamespaceSpecifier': {
                /**
                 * import * as A from 'module';
                 * NOTE: adding all properties to default property is better to keep compatibility
                 * e.g.
                 * module['default'].default
                 * module['default'].value
                 */
                if (path.container.property) {
                  isImportNamespaceSpecifier = true;
                  name = path.container.property.name;
                }
                break;
              }
              // import A from 'module'
              case 'ImportDefaultSpecifier': {
                if (local.name === localName) {
                  name = 'default';
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
                  if (imported.name === 'default') {
                    name = null;
                  } else {
                    name = imported.name;
                  }
                }
                break;
              }
            }
          });

          const parentSrcName = parent.source.value;
          const moduleId = getModuleId(modulesMap, currentPath, parentSrcName, entryDir);
          // __BUNDLE__{id}[function/variable name]
          const assignment = t.identifier(
            `${prefix}${moduleId}${
              /* example of empty name
               * import * as A from 'module';
               * console.log(A); // show all properties of `module`
               * */ name ? `[${JSON.stringify(name)}]` : ''
            }`
          );

          if (isImportNamespaceSpecifier) {
            // replace `['foo'].foo` with `['foo']`
            path.parentPath.replaceWith(assignment);
          } else {
            /**
             *  (0, __BUNDLE__{id}['name'])(args);
             *  path.parentPath.replaceWith(
             *    t.callExpression(
             *      t.sequenceExpression([t.numericLiteral(0), assignment]),
             *      path.node.arguments
             *    )
             *  );
             */
            path.replaceWith(assignment);
          }
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
        const moduleId = getModuleId(modulesMap, currentPath, importSource, entryDir);
        const assignment = t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier(`${prefix}${moduleId}`),
            // bundle can change the ID from require('module')
            t.callExpression(t.identifier('require'), [t.stringLiteral(importSource)])
          ),
        ]);

        path.replaceWith(assignment);
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
  transformToCjs,
};
