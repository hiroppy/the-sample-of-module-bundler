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

    let ast;
    let moduleType = 'none';

    try {
      ast = parse(readFileSync(filePath, 'utf-8'));
    } catch (e) {
      throw new Error(`could not find the module: ${filePath}`);
    }

    visitedFiles.push(filePath);

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

      // CJS: module.exports
      ExpressionStatement({ node: { expression } }) {
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
  }

  return modulesMap;
}

module.exports = { buildModulesMap };
