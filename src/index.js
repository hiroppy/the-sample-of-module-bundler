'use strict';

const { promises, readFileSync } = require('fs');
const { extname, dirname, basename, relative } = require('path');
const parser = require('@babel/parser');
const { default: traverse } = require('@babel/traverse');
const { default: generate } = require('@babel/generator');
const { mainTemplate, moduleTemplate } = require('./template');
const { getScriptFilePath, isNodeModule } = require('./pathUtils');

async function buildModulesMap(entryDir, entryFilename) {
  const modulesMap = new Set();
  const entryPath = getScriptFilePath(entryDir, `./${entryFilename}`);
  const entryCodeAst = parser.parse(await promises.readFile(entryPath, 'utf8'));

  // add an entry point
  modulesMap.add({
    id: 0,
    path: entryPath, // an absolute path
    ast: entryCodeAst,
  });

  // start from the entry-point to check all deps
  walkDeps(entryCodeAst, entryDir);

  function walkDeps(ast, currentDir) {
    traverse(ast, {
      CallExpression({ node: { callee, arguments: args } }) {
        if (callee.type === 'Identifier' && callee.name === 'require') {
          const filePath = getScriptFilePath(currentDir, args[0].value);
          const hasAlreadyModule = Array.from(modulesMap).some(({ path }) => path === filePath);

          if (!hasAlreadyModule) {
            try {
              // reset the current directory when node_modules
              // ./ has 2 types which are local of the first party and local of the third party module
              const nextDir = isNodeModule(args[0].value) ? entryDir : dirname(filePath);
              const ast = parser.parse(readFileSync(filePath, 'utf-8'));

              modulesMap.add({
                id: modulesMap.size,
                ast,
                path: filePath,
              });

              walkDeps(ast, nextDir);
            } catch (e) {
              console.warn('could not find the module:', e.message);
            }
          }
        }
      },
    });
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
          const filePath = getScriptFilePath(
            // don't reset the path when node_modules
            // because the path during searching in node_modules is the base path of modulesMap
            isNodeModule(args[0].value) ? dirname(path) : basePath,
            args[0].value
          );
          const { id: moduleId } =
            Array.from(modulesMap.values()).find(({ path }) => path === filePath) || {};

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
  const modulesMap = await buildModulesMap(entryDir, entryFilename);
  const modules = convertToModuleId(entryDir, modulesMap);

  // export bundled code
  await promises.writeFile(output, mainTemplate(modules, 0));
}

module.exports = bundler;
