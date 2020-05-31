'use strict';

const { join, extname, dirname, basename } = require('path');

function isNodeModule(filename) {
  return !filename.startsWith('.');
}

function getFilename(filename) {
  // index.js === . or main field is undefined
  if (filename === '.' || filename === undefined) {
    return 'index.js';
  }

  // omit .js
  if (extname(filename) === '') {
    return `${filename}.js`;
  }

  return filename;
}

function getScriptFilePath(basePath, filename) {
  if (!isNodeModule(filename)) {
    return join(basePath, getFilename(filename));
  }

  // node_modules
  const moduleBasePath = join(basePath, 'node_modules', filename);

  // e.g. require('a/b')
  // need to split by /
  if (filename.includes('/')) {
    const dir = dirname(moduleBasePath);
    const name = basename(moduleBasePath);

    return join(dir, getFilename(name));
  }

  // TODO: add module, browser, exports
  const { main } = require(join(moduleBasePath, 'package.json'));

  // when main field is undefined, index.js will be an entry point
  return join(moduleBasePath, getFilename(main));
}

module.exports = {
  isNodeModule,
  getFilename,
  getScriptFilePath,
};
