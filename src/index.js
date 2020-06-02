'use strict';

const { promises, readFileSync } = require('fs');
const { extname, dirname, basename, relative, join, resolve } = require('path');
const { default: traverse } = require('@babel/traverse');
const { default: generate } = require('@babel/generator');
const { transformAst } = require('./transformAst');
const { mainTemplate, moduleTemplate, registerESMTemplate } = require('./template');
const { parse } = require('./utils/parser');
const { getScriptFilePath } = require('./utils/path');
const { getModule, resolveModulePath } = require('./utils/module');

async function buildModulesMap(entryDir, entryFilename) {
  const modulesMap = new Set();
  const entryPath = getScriptFilePath(entryDir, entryFilename);
  const entryCodeAst = parse(await promises.readFile(entryPath, 'utf8'));
  const visitedFiles = [];

  // start from the entry-point to check all deps
  walkDeps(entryDir, entryPath, entryFilename);

  function walkDeps(currentDir, beforePath, src) {
    const { nextRoot, filePath } = resolveModulePath(src, entryDir, beforePath);

    if (visitedFiles.includes(filePath)) {
      return;
    }

    visitedFiles.push(filePath);

    try {
      const ast = parse(readFileSync(filePath, 'utf-8'));
      let type = 'esm';

      traverse(ast, {
        // import
        ImportDeclaration({ node: { type, source } }) {
          type = 'esm';
          walkDeps(nextRoot, filePath, source.value);
        },

        // require
        CallExpression({ node: { callee, arguments: args } }) {
          if (callee.type === 'Identifier' && callee.name === 'require') {
            type = 'cjs';
            walkDeps(nextRoot, filePath, args[0].value);
          }
        },

        // check ESM or CJS
        // exports or module.exports or ESM export
        ExpressionStatement({ node: { expression } }) {
          if (expression.operator === '=') {
            type = 'cjs';
          }
        },
      });

      modulesMap.add({
        id: modulesMap.size, // the entry point's id is 0
        ast,
        path: filePath, // an absolute path
        type, // in fact, CJS as default is better
      });
    } catch (e) {
      console.warn('could not find the module:', filePath);
    }
  }

  return modulesMap;
}

// replace a module path with a moduleId
function convertToModuleId(basePath, modulesMap) {
  const modules = new Map();

  for (const { id, ast, path } of modulesMap.values()) {
    traverse(ast, {
      CallExpression({ node: { callee, arguments: args } }) {
        if (callee.type === 'Identifier' && callee.name === 'require') {
          const { id: moduleId } = getModule(modulesMap, path, args[0].value, basePath);

          args[0].value = moduleId;
        }
      },
    });

    modules.set(id, {
      path,
      code: moduleTemplate(generate(ast).code),
    });
  }

  return modules;
}

async function bundler({ entry, output }) {
  const entryFilename = basename(entry);
  const entryDir = dirname(entry);
  const modulesMap = await buildModulesMap(entryDir, `./${entryFilename}`);
  const hasEsmModules = Array.from(modulesMap.values()).some(({ type }) => type === 'esm');
  const { id: entryPointId } = Array.from(modulesMap).find(({ path }) => path === entry);

  transformAst(entryDir, modulesMap);

  const modules = convertToModuleId(entryDir, modulesMap);

  // export bundled code
  await promises.writeFile(output, mainTemplate(modules, entryPointId, hasEsmModules));
}

module.exports = bundler;
