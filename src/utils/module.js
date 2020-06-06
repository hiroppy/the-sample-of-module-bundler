'use strict';

const { dirname, resolve } = require('path');
const { getScriptFilePath, getFilename, isNodeModule } = require('./path');

function resolveModulePath(modulePath, baseRoot, beforeModulePath) {
  // reset the current directory when node_modules
  // ./ has 2 types which are local of the first party and local of the third party module
  if (isNodeModule(modulePath)) {
    return getScriptFilePath(baseRoot, modulePath);
  } else {
    const nextRoot = dirname(beforeModulePath);

    return resolve(nextRoot, getFilename(modulePath));
  }
}

function getModule(modulesMap, currentModulePath, moduleName, basePath) {
  const filePath = getScriptFilePath(
    !isNodeModule(moduleName) ? dirname(currentModulePath) : basePath,
    moduleName
  );

  return Array.from(modulesMap.values()).find(({ path }) => path === filePath) || {};
}

module.exports = {
  isNodeModule,
  getModule,
  resolveModulePath,
};
