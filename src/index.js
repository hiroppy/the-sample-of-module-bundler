'use strict';

const { promises, readFileSync } = require('fs');
const { extname, dirname, basename, relative, join, resolve } = require('path');
const { default: traverse } = require('@babel/traverse');
const { default: generate } = require('@babel/generator');
const { transformToCjs } = require('./transformToCjs');
const { mainTemplate, moduleTemplate, registerESMTemplate } = require('./template');
const { parse } = require('./utils/parser');
const { getScriptFilePath } = require('./utils/path');
const { getModuleId, resolveModulePath } = require('./utils/module');

async function buildModulesMap(entryDir, entryFilename) {
  const modulesMap = new Set();
  const entryPath = getScriptFilePath(entryDir, `./${entryFilename}`);
  const entryCodeAst = parse(await promises.readFile(entryPath, 'utf8'));
  let isESM = false;

  // add an entry point
  modulesMap.add({
    id: 0,
    path: entryPath, // an absolute path
    ast: entryCodeAst,
  });

  // start from the entry-point to check all deps
  walkDeps(entryCodeAst, entryDir, entryPath);

  function walkDeps(ast, currentDir, beforePath) {
    traverse(ast, {
      // import
      ImportDeclaration({ node: { type, source } }) {
        isESM = true;

        const { nextRoot, filePath } = resolveModulePath(source.value, entryDir, beforePath);
        const hasAlreadyModule = Array.from(modulesMap).some(({ path }) => path === filePath);

        if (!hasAlreadyModule) {
          try {
            const ast = parse(readFileSync(filePath, 'utf-8'));

            modulesMap.add({
              id: modulesMap.size,
              ast,
              path: filePath,
            });

            walkDeps(ast, nextRoot, filePath);
          } catch (e) {
            console.warn('could not find the module:', e.message);
          }
        }
      },

      // require
      CallExpression({ node: { callee, arguments: args } }) {
        if (callee.type === 'Identifier' && callee.name === 'require') {
          const { nextRoot, filePath } = resolveModulePath(args[0].value, entryDir, beforePath);
          const hasAlreadyModule = Array.from(modulesMap).some(({ path }) => path === filePath);

          if (!hasAlreadyModule) {
            try {
              const ast = parse(readFileSync(filePath, 'utf-8'));

              modulesMap.add({
                id: modulesMap.size,
                ast,
                path: filePath,
              });

              walkDeps(ast, nextRoot, filePath);
            } catch (e) {
              console.warn('could not find the module:', e.message);
            }
          }
        }
      },
    });
  }

  return { modulesMap, isESM };
}

// replace a module path with a moduleId
function convertToModuleId(basePath, modulesMap) {
  const modules = new Map();

  for (const { id, ast, path } of modulesMap.values()) {
    traverse(ast, {
      CallExpression({ node: { callee, arguments: args } }) {
        if (callee.type === 'Identifier' && callee.name === 'require') {
          const moduleId = getModuleId(modulesMap, path, args[0].value, basePath);

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
  const { modulesMap, isESM } = await buildModulesMap(entryDir, entryFilename);

  transformToCjs(entryDir, modulesMap);

  const modules = convertToModuleId(entryDir, modulesMap);

  // export bundled code
  await promises.writeFile(output, mainTemplate(modules, 0, isESM));
}

module.exports = bundler;
