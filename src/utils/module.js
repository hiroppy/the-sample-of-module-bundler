'use strict';

const { dirname, resolve } = require('path');
const { getScriptFilePath, getFilename, isNodeModule } = require('./path');

function resolveModulePath(modulePath, baseRoot, beforeModulePath) {
  // reset the current directory when node_modules
  // ./ has 2 types which are local of the first party and local of the third party module
  if (isNodeModule(modulePath)) {
    return {
      nextRoot: baseRoot,
      filePath: getScriptFilePath(baseRoot, modulePath),
    };
  } else {
    const nextRoot = dirname(beforeModulePath);

    return {
      nextRoot,
      filePath: resolve(nextRoot, getFilename(modulePath)),
    };
  }
}

function getModuleId(modulesMap, currentModulePath, moduleName, basePath) {
  const filePath = getScriptFilePath(
    !isNodeModule(moduleName) ? dirname(currentModulePath) : basePath,
    moduleName
  );
  const { id } = Array.from(modulesMap.values()).find(({ path }) => path === filePath) || {};

  return id;
}

module.exports = {
  isNodeModule,
  getModuleId,
  resolveModulePath,
};
