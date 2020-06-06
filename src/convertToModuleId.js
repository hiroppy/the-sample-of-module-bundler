'use strict';

const { default: traverse } = require('@babel/traverse');
const { default: generate } = require('@babel/generator');
const { moduleTemplate } = require('./template');
const { getModule } = require('./utils/module');

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

module.exports = { convertToModuleId };
