'use strict';

const { promises, readFileSync } = require('fs');
const { dirname, basename, join } = require('path');
const Terser = require('terser');
const { mainTemplate } = require('./template');
const { getModule, resolveModulePath } = require('./utils/module');
const { transformAst } = require('./transformAst');
const { buildModulesMap } = require('./buildModulesMap');
const { convertToModuleId } = require('./convertToModuleId');

async function bundler({ entry, output }) {
  const entryFilename = basename(entry);
  const entryDir = dirname(entry);
  const minifiedFilename = `${basename(output).split('.js')[0]}.min.js`;
  const modulesMap = await buildModulesMap(entryDir, `./${entryFilename}`);
  const hasEsmModules = Array.from(modulesMap.values()).some(({ type }) => type === 'esm');
  const { id: entryPointId } = Array.from(modulesMap).find(({ path }) => path === entry);

  transformAst(entryDir, modulesMap);

  const modules = convertToModuleId(entryDir, modulesMap);
  const outputCode = mainTemplate(modules, entryPointId, hasEsmModules);
  const { code: minifiedCode } = Terser.minify(outputCode);

  // export bundled code
  await promises.writeFile(output, outputCode);
  await promises.writeFile(join(dirname(output), minifiedFilename), minifiedCode);
}

module.exports = bundler;
