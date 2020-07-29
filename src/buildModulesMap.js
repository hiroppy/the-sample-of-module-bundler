'use strict';

const { promises, readFileSync } = require('fs');
const { default: traverse } = require('@babel/traverse');
const { parse } = require('./utils/parser');
const { getScriptFilePath } = require('./utils/path');
const { resolveModulePath } = require('./utils/module');

async function buildModulesMap(entryDir, entryFilename) {
  const modulesMap = new Set();
  const entryPath = getScriptFilePath(entryDir, entryFilename);
  const visitedFiles = [];

  // start from the entry-point to check all deps
  walkDeps(entryPath, entryFilename);

  function walkDeps(prevPath, src) {
    const filePath = resolveModulePath(src, entryDir, prevPath);

    if (visitedFiles.includes(filePath)) {
      return;
    }

    visitedFiles.push(filePath);

    try {
      const ast = parse(readFileSync(filePath, 'utf-8'));
      let moduleType = 'none';

      traverse(ast, {
        // ESM: import
        ImportDeclaration({ node: { type, source } }) {
          moduleType = 'esm';
          walkDeps(filePath, source.value);
        },

        // CJS: require
        CallExpression({ node: { callee, arguments: args } }) {
          if (callee.type === 'Identifier' && callee.name === 'require') {
            moduleType = 'cjs';
            walkDeps(filePath, args[0].value);
          }
        },

        // ESM: export
        ExportDeclaration() {
          moduleType = 'esm';
        },

        // check ESM or CJS
        // exports or module.exports or ESM export
        ExpressionStatement({ node: { expression } }) {
          // module.exports
          if (expression.operator === '=') {
            moduleType = 'cjs';
          }
        },
      });

      modulesMap.add({
        id: modulesMap.size, // 0 is the first id
        ast,
        path: filePath, // an absolute path
        type: moduleType,
      });
    } catch (e) {
      console.warn('could not find the module:', filePath);
    }
  }

  return modulesMap;
}

module.exports = { buildModulesMap };
